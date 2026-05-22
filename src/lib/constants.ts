export const platforms = [
	'Netflix',
	'HBO Max',
	'Viaplay',
	'Disney+',
	'Apple TV+',
	'Kino',
	'Hjemme'
] as const;

export const statusLabel: Record<string, string> = {
	watching: '▶ Ser nå',
	paused: '⏸ Pause',
	completed: '✓ Ferdig'
};

export const statusColor: Record<string, string> = {
	watching: 'bg-green-100 text-green-700',
	paused: 'bg-yellow-100 text-yellow-700',
	completed: 'bg-gray-100 text-gray-500'
};
