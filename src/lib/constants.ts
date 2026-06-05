export const platforms = [
	'Netflix',
	'HBO Max',
	'Viaplay',
	'Disney+',
	'Apple TV+',
	'Paramount+',
	'SkyShowtime',
	'NRK',
	'TV 2 Play',
	'Kino'
] as const;

export const statusLabel: Record<string, string> = {
	watching: '▶ Ser nå',
	paused: '⏸ Pause',
	completed: '✓ Ferdig',
	archived: '📦 Arkivert'
};

export const statusColor: Record<string, string> = {
	watching: 'bg-green-100 text-green-700',
	paused: 'bg-yellow-100 text-yellow-700',
	completed: 'bg-gray-100 text-gray-500',
	archived: 'bg-slate-100 text-slate-400'
};

export const watchStatuses = ['watching', 'paused', 'completed', 'archived'] as const;
export type WatchStatus = (typeof watchStatuses)[number];
