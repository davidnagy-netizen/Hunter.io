<?php

namespace App\Services;

use App\Exceptions\ApiError;

use App\Models\Lead;
use App\Models\Opportunity;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class Crm
{
    public const STAGES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

    public function __construct(private Accounts $accounts, private Profiles $profiles) {}

    public function subject(string $id): User|Lead
    {
        if (str_starts_with($id, 'lead:')) {
            return Lead::find(substr($id, 5)) ?? throw new ApiError('NO_SUCH_CONTACT', 404);
        }

        return User::find($id) ?? throw new ApiError('NO_SUCH_CONTACT', 404);
    }

    public function id(User|Lead $s): string
    {
        return ($s instanceof Lead ? 'lead:' : '').$s->id;
    }

    public function record(User|Lead $s): array
    {
        $json = DB::table('api_crm_records')->where('subject_id', $this->id($s))->value('data');

        return ($json ? json_decode($json, true) : []) + ['notes' => [], 'tasks' => [], 'tags' => []];
    }

    public function mutate(User|Lead $s, callable $change): mixed
    {
        return DB::transaction(function () use ($s, $change) {
            $s->newQuery()->whereKey($s->id)->lockForUpdate()->firstOrFail();
            $data = $this->record($s);
            $result = $change($data);
            DB::table('api_crm_records')->updateOrInsert(['subject_id' => $this->id($s)], ['data' => json_encode($data, JSON_THROW_ON_ERROR)]);

            return $result;
        });
    }

    public function vocabulary(): array
    {
        $entries = fn ($ids, $hu, $en) => array_map(fn ($id, $h, $e) => ['id' => $id, 'label_hu' => $h, 'label_en' => $e], $ids, $hu, $en);

        return ['stages' => $entries(self::STAGES, ['Új', 'Kapcsolatfelvétel', 'Minősített', 'Ajánlat', 'Megnyert', 'Elvesztett'], ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost']),
            'lifecycles' => $entries(['lead', 'registered', 'trial', 'subscriber', 'expired'], ['Érdeklődő', 'Regisztrált', 'Próba', 'Előfizető', 'Lejárt'], ['Lead', 'Registered', 'Trial', 'Subscriber', 'Expired']),
            'sources' => $entries(['assessment', 'signup', 'admin'], ['Felmérés', 'Regisztráció', 'Admin'], ['Assessment', 'Signup', 'Admin']),
            'plans' => array_map(fn ($p) => $p + ['priceHUF' => null, 'monthlyHUF' => $p['id'] === 'trial' ? 0 : (isset($p['priceHUF']) ? $p['priceHUF'] * 30 / $p['days'] : null)], $this->accounts->plans())];
    }

    public function engagement(array $activity): array
    {
        $definitions = ['account.login' => [2, 10, 'Bejelentkezés', 'Sign-in'], 'profile.saved' => [8, 24, 'Profil mentése', 'Profile saved'],
            'profile.answered' => [5, 20, 'Válasz', 'Answer'], 'opportunity.viewed' => [2, 20, 'Megtekintés', 'Opportunity viewed'],
            'opportunity.saved' => [10, 30, 'Mentett pályázat', 'Opportunity saved'], 'search' => [3, 15, 'Keresés', 'Search']];
        $signals = [];
        $raw = 0;
        $recent = array_filter($activity, fn ($a) => Carbon::parse($a['at'])->gte(now()->subDays(30)));
        foreach ($definitions as $type => [$points, $cap, $hu, $en]) {
            $count = count(array_filter($recent, fn ($a) => $a['type'] === $type));
            if ($count) {
                $value = min($cap, $count * $points);
                $raw += $value;
                $signals[] = ['type' => $type, 'count' => $count, 'points' => $value, 'label_hu' => $hu, 'label_en' => $en];
            }
        }
        $last = collect($activity)->filter(fn ($a) => isset($definitions[$a['type']]))->max('at');
        $days = $last ? max(0, (int) Carbon::parse($last)->diffInDays(now())) : null;
        $score = (int) round(min(100, $raw) * ($days === null ? 0 : ($days <= 7 ? 1 : max(.2, 1 - ($days - 7) / 23 * .8))));
        $key = $score >= 60 ? 'high' : ($score >= 20 ? 'medium' : ($score > 0 ? 'low' : 'none'));
        $hu = ['high' => 'Magas', 'medium' => 'Közepes', 'low' => 'Alacsony', 'none' => 'Nincs'];

        return ['score' => $score, 'signals' => $signals, 'window' => 30, 'lastActiveAt' => $last, 'daysSinceActive' => $days,
            'band' => ['key' => $key, 'label_hu' => $hu[$key], 'label_en' => ucfirst($key)]];
    }

    public function contact(User|Lead $s): array
    {
        $account = $s instanceof User;
        $record = $this->record($s);
        $state = $account ? $this->accounts->state($s) : ['activity' => [], 'versions' => []];
        $sub = $account ? $this->accounts->subscription($s) : ['status' => 'none', 'plan' => null, 'active' => false, 'validUntil' => null, 'daysLeft' => null];
        $lifecycle = ! $account ? 'lead' : ($sub['active'] ? ($sub['plan'] === 'trial' ? 'trial' : 'subscriber') : ($sub['validUntil'] ? 'expired' : 'registered'));
        $stage = $record['stage'] ?? match ($lifecycle) {
            'subscriber' => 'won', 'trial' => 'proposal', 'expired' => 'contacted', default => 'new'
        };
        $open = array_values(array_filter($record['tasks'], fn ($t) => ! $t['doneAt']));
        usort($open, fn ($a, $b) => ($a['dueAt'] ?? '9999') <=> ($b['dueAt'] ?? '9999'));
        $plan = collect($this->vocabulary()['plans'])->firstWhere('id', $sub['plan']);
        $extra = ! $account ? (json_decode($s->getRawOriginal('api_extra') ?? '{}', true) ?: []) : [];
        $profile = $account ? $this->profiles->current($s) : ($extra['profile'] ?? null);

        return ['id' => $this->id($s), 'kind' => $account ? 'account' : 'lead', 'username' => $account ? $s->username : null,
            'email' => $s->email, 'company' => $s->company, 'contactName' => $account ? $s->name : $s->contact_name,
            'phone' => $account ? null : $s->phone, 'role' => $account ? $s->role : 'lead', 'disabled' => $account && $s->disabled,
            'createdAt' => $s->created_at->toISOString(), 'lastLoginAt' => $account ? $s->last_login_at?->toISOString() : null,
            'lifecycle' => $lifecycle, 'stage' => $stage, 'stageSetBy' => $record['stageSetBy'] ?? null, 'stageSetAt' => $record['stageSetAt'] ?? null,
            'daysInStage' => max(0, (int) Carbon::parse($record['stageSetAt'] ?? $s->created_at)->diffInDays(now())),
            'owner' => $record['owner'] ?? null, 'tags' => $record['tags'], 'source' => $record['source'] ?? ($account ? 'signup' : ($s->source === 'assessment' ? 'assessment' : 'admin')),
            'lostReason' => $record['lostReason'] ?? null, 'subscription' => $sub,
            'monthlyValueHuf' => $sub['active'] && $sub['plan'] !== 'trial' ? ($plan['monthlyHUF'] ?? null) : 0,
            'engagement' => $this->engagement($state['activity']), 'readiness' => $account ? null : $s->readiness_score,
            'profileVersions' => count($state['versions']), 'hasProfile' => (bool) $profile, 'convertedUserId' => ! $account && $s->user_id ? (string) $s->user_id : null,
            'profile' => $profile ?: null, 'notes' => count($record['notes']), 'lastNote' => $record['notes'][0] ?? null,
            'openTasks' => count($open), 'nextTask' => $open[0] ?? null, 'overdueTasks' => count(array_filter($open, fn ($t) => $t['dueAt'] && Carbon::parse($t['dueAt'])->isPast()))];
    }

    public function contacts(): array
    {
        return [...User::where('role', '!=', 'admin')->get()->map(fn ($s) => $this->contact($s))->all(), ...Lead::all()->map(fn ($s) => $this->contact($s))->all()];
    }

    public function detail(User|Lead $s): array
    {
        $c = $this->contact($s);
        $record = $this->record($s);
        $state = $s instanceof User ? $this->accounts->state($s) : ['versions' => [], 'subscriptions' => [], 'activity' => [], 'saved' => []];
        $timeline = [];
        foreach (['activity' => $state['activity'], 'subscription' => $state['subscriptions'], 'profile' => $state['versions'], 'note' => $record['notes'], 'task' => $record['tasks']] as $kind => $items) {
            foreach ($items as $item) {
                $timeline[] = ['at' => $item['at'], 'kind' => $kind, 'type' => match ($kind) {
                    'activity' => $item['type'], 'subscription' => 'subscription.'.$item['action'], 'profile' => 'profile.version', 'note' => 'note.'.$item['kind'], default => 'task.created'
                }, 'detail' => (object) $item];
                if ($kind === 'task' && $item['doneAt']) {
                    $timeline[] = ['at' => $item['doneAt'], 'kind' => 'task', 'type' => 'task.completed', 'detail' => (object) $item];
                }
            }
        }
        usort($timeline, fn ($a, $b) => strcmp($b['at'], $a['at']));

        return ['contact' => $c, 'profile' => $c['profile'], 'notes' => $record['notes'], 'tasks' => $record['tasks'], 'versions' => $state['versions'],
            'subscriptions' => $state['subscriptions'], 'timeline' => array_slice($timeline, 0, 120),
            'savedCalls' => array_map(function ($id) {
                $o = Opportunity::where('code', $id)->first();

                return ['id' => $id, 'title' => $o?->title, 'program' => $o?->program, 'deadline' => $o?->deadline?->toDateString()];
            }, $state['saved']),
            'plans' => $this->accounts->plans(), 'vocabulary' => $this->vocabulary()] + ($s instanceof Lead ? ['lead' => $s->toArray()] : []);
    }

    public function board(): array
    {
        $contacts = $this->contacts();
        $board = array_fill_keys(self::STAGES, []);
        $tasks = [];
        foreach ($contacts as $c) {
            $board[$c['stage']][] = $c;
            $record = $this->record($this->subject($c['id']));
            foreach ($record['tasks'] as $t) {
                if (! $t['doneAt']) {
                    $tasks[] = $t + ['subjectId' => $c['id'], 'subjectKind' => $c['kind'], 'company' => $c['company'], 'username' => $c['username']];
                }
            }
        }
        foreach ($board as &$column) {
            usort($column, fn ($a, $b) => $b['daysInStage'] <=> $a['daysInStage']);
        }
        unset($column);
        usort($tasks, fn ($a, $b) => ($a['dueAt'] ?? '9999') <=> ($b['dueAt'] ?? '9999'));
        $list = collect($contacts);
        $accounts = $list->where('kind', 'account');
        $paid = $accounts->where('lifecycle', 'subscriber');
        $mrr = $paid->contains(fn ($c) => $c['monthlyValueHuf'] === null) ? null : $paid->sum('monthlyValueHuf');
        $open = $list->filter(fn ($c) => ! in_array($c['stage'], ['won', 'lost']));
        $monthly = collect($this->vocabulary()['plans'])->firstWhere('id', 'monthly')['monthlyHUF'] ?? null;
        $trialStarted = 0;
        $trialConverted = 0;
        $logs = [];
        foreach (User::where('role', '!=', 'admin')->get() as $u) {
            $log = $this->accounts->state($u)['subscriptions'];
            $trials = array_filter($log, fn ($e) => ($e['plan'] ?? null) === 'trial' && $e['action'] === 'granted');
            if ($trials) {
                $trialStarted++;
                $first = min(array_column($trials, 'at'));
                if (array_filter($log, fn ($e) => $e['action'] === 'granted' && ($e['plan'] ?? 'trial') !== 'trial' && $e['at'] >= $first)) {
                    $trialConverted++;
                }
            }
            $logs = [...$logs, ...$log];
        }
        $byPlan = [];
        foreach ($paid->groupBy('subscription.plan') as $id => $group) {
            $byPlan[$id] = ['count' => $group->count(), 'monthlyHuf' => $group->contains(fn ($c) => $c['monthlyValueHuf'] === null) ? null : $group->sum('monthlyValueHuf')];
        }
        $lapsed = $accounts->filter(fn ($c) => $c['lifecycle'] === 'expired' && $c['subscription']['validUntil'] && Carbon::parse($c['subscription']['validUntil'])->gte(now()->subDays(30)))->count();
        $metrics = ['contacts' => count($contacts), 'accounts' => $accounts->count(), 'leads' => $list->where('kind', 'lead')->count(),
            'subscribers' => $paid->count(), 'trials' => $accounts->where('lifecycle', 'trial')->count(), 'expired' => $accounts->where('lifecycle', 'expired')->count(), 'registered' => $accounts->where('lifecycle', 'registered')->count(),
            'mrrHuf' => $mrr, 'arrHuf' => $mrr === null ? null : $mrr * 12, 'arpaHuf' => $mrr === null ? null : ($paid->count() ? $mrr / $paid->count() : 0),
            'pipelineValueHuf' => $open->isEmpty() ? 0 : ($monthly === null ? null : $open->count() * $monthly), 'openDeals' => $open->count(),
            'byStage' => (object) $list->countBy('stage')->all(), 'byPlan' => (object) $byPlan, 'bySource' => (object) $list->countBy('source')->all(),
            'trialStarted' => $trialStarted, 'trialConverted' => $trialConverted, 'trialConversionPct' => $trialStarted ? (int) round(100 * $trialConverted / $trialStarted) : null,
            'lapsed30d' => $lapsed, 'churnPct' => $lapsed + $paid->count() ? (int) round(100 * $lapsed / ($lapsed + $paid->count())) : null,
            'engagedAccounts' => $accounts->filter(fn ($c) => $c['engagement']['score'] >= 20)->count(),
            'warmUnsubscribed' => $accounts->filter(fn ($c) => ! $c['subscription']['active'] && $c['engagement']['score'] >= 20)->sortByDesc('engagement.score')->take(8)->map(fn ($c) => ['id' => $c['id'], 'company' => $c['company'], 'username' => $c['username'], 'lifecycle' => $c['lifecycle'], 'score' => $c['engagement']['score'], 'daysSinceActive' => $c['engagement']['daysSinceActive']])->values()->all()];
        $trend = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->startOfMonth()->subMonths($i);
            $key = $month->format('Y-m');
            $trend[] = ['key' => $key, 'year' => $month->year, 'month' => $month->month,
                'signups' => $accounts->filter(fn ($c) => str_starts_with($c['createdAt'], $key))->count(),
                'leads' => $list->where('kind', 'lead')->filter(fn ($c) => str_starts_with($c['createdAt'], $key))->count(),
                'won' => count(array_filter($logs, fn ($e) => $e['action'] === 'granted' && ($e['plan'] ?? 'trial') !== 'trial' && str_starts_with($e['at'], $key)))];
        }

        return ['vocabulary' => $this->vocabulary(), 'metrics' => $metrics, 'trend' => $trend, 'board' => (object) $board,
            'tasks' => array_slice($tasks, 0, 40), 'engagementWindowDays' => 30, 'generatedAt' => now()->toISOString()];
    }
}
