-- First, update the check constraint to allow 'country' type
ALTER TABLE public.location_nodes DROP CONSTRAINT IF EXISTS location_nodes_type_check;
ALTER TABLE public.location_nodes ADD CONSTRAINT location_nodes_type_check CHECK (type IN ('country', 'county', 'location'));

-- Clean up non-Kenya countries
DELETE FROM public.location_nodes WHERE type = 'country' AND name != 'Kenya';

-- Ensure Kenya node exists and is the primary parent
INSERT INTO public.location_nodes (id, name, type) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Kenya', 'country')
ON CONFLICT (id) DO UPDATE SET name = 'Kenya', type = 'country';

-- Link all counties to Kenya
UPDATE public.location_nodes 
SET parent_id = '00000000-0000-0000-0000-000000000001'
WHERE type = 'county';
