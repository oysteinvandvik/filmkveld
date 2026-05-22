export const load = async ({ locals: { safeGetSession } }) => {
	const { session } = await safeGetSession();
	return { session };
};
