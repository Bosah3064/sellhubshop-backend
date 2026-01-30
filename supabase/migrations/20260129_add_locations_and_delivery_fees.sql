-- Create location_nodes table
CREATE TABLE IF NOT EXISTS public.location_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('county', 'location')),
    parent_id UUID REFERENCES public.location_nodes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add delivery fee columns to profiles if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='profiles' AND COLUMN_NAME='local_delivery_fee') THEN
        ALTER TABLE public.profiles ADD COLUMN local_delivery_fee NUMERIC(20, 2) DEFAULT 200.00 NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='profiles' AND COLUMN_NAME='outside_delivery_fee') THEN
        ALTER TABLE public.profiles ADD COLUMN outside_delivery_fee NUMERIC(20, 2) DEFAULT 350.00 NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='profiles' AND COLUMN_NAME='business_location') THEN
        ALTER TABLE public.profiles ADD COLUMN business_location TEXT;
    END IF;
END $$;

-- Enable RLS for location_nodes
ALTER TABLE public.location_nodes ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view locations
DROP POLICY IF EXISTS "Allow public read access to locations" ON public.location_nodes;
CREATE POLICY "Allow public read access to locations" ON public.location_nodes
    FOR SELECT USING (true);

-- Insert Counties and Locations (Seed Data)
-- We will use a script or manual insert for this to avoid huge SQL blocks if possible, 
-- but since I need to do it now, I'll include the major ones.

WITH nairobi AS (INSERT INTO public.location_nodes (id, name, type) VALUES (uuid_generate_v4(), 'Nairobi', 'county') RETURNING id),
mombasa AS (INSERT INTO public.location_nodes (id, name, type) VALUES (uuid_generate_v4(), 'Mombasa', 'county') RETURNING id),
kiambu AS (INSERT INTO public.location_nodes (id, name, type) VALUES (uuid_generate_v4(), 'Kiambu', 'county') RETURNING id),
nakuru AS (INSERT INTO public.location_nodes (id, name, type) VALUES (uuid_generate_v4(), 'Nakuru', 'county') RETURNING id),
kisumu AS (INSERT INTO public.location_nodes (id, name, type) VALUES (uuid_generate_v4(), 'Kisumu', 'county') RETURNING id)
INSERT INTO public.location_nodes (name, type, parent_id)
SELECT loc, 'location', nairobi.id FROM nairobi, (VALUES ('Westlands'), ('Kilimani'), ('Karen'), ('Langata'), ('Kileleshwa'), ('Lavington'), ('Runda'), ('Parklands'), ('South B'), ('South C'), ('Embakasi'), ('Kasarani'), ('CBD'), ('Upper Hill'), ('Eastleigh'), ('Donholm'), ('Buruburu')) as t(loc)
UNION ALL
SELECT loc, 'location', mombasa.id FROM mombasa, (VALUES ('Nyali'), ('Bamburi'), ('Kisauni'), ('Mvita'), ('Likoni'), ('Changamwe'), ('Shanzu'), ('Mtwapa')) as t(loc)
UNION ALL
SELECT loc, 'location', kiambu.id FROM kiambu, (VALUES ('Thika'), ('Kiambu Town'), ('Ruiru'), ('Juja'), ('Kikuyu'), ('Limuru'), ('Karuri')) as t(loc)
UNION ALL
SELECT loc, 'location', nakuru.id FROM nakuru, (VALUES ('Nakuru Town'), ('Naivasha'), ('Gilgil'), ('Molo'), ('Njoro')) as t(loc)
UNION ALL
SELECT loc, 'location', kisumu.id FROM kisumu, (VALUES ('Kisumu Town'), ('Milimani'), ('Nyalenda'), ('Kondele'), ('Mamboleo')) as t(loc);
