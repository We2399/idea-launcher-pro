-- Clear old leave allocations and profile change requests for clean trial run
DELETE FROM public.leave_allocations;
DELETE FROM public.profile_change_requests;