create extension if not exists vector with schema extensions;

create table documents (
  id bigint primary key generated always as identity,
  name text not null,
  storage_object_id uuid not null references storage.objects,
  created_by uuid not null references auth.users (id) default auth.uid(),
  created_at timestamp with time zone not null default now(),
  status text not null default 'initial'
);

create view documents_with_storage_path
with (security_invoker=true)
as
  select documents.*, storage.objects.name as storage_object_path
  from documents
  join storage.objects
    on storage.objects.id = documents.storage_object_id;

create table document_sections (
  id bigserial primary key,
  content text,
  metadata jsonb,   -- will store user_id and document_id
  embedding vector (1536) -- TODO: Does this have to match token size of model?
);

create index on document_sections using hnsw (embedding vector_ip_ops);

alter table documents enable row level security;
alter table document_sections enable row level security;

create policy "Users can insert documents"
on documents for insert to authenticated with check (
  auth.uid() = created_by
);

create policy "Users can update documents"
on documents for update to authenticated using (
  auth.uid() = created_by
) with check (
  auth.uid() = created_by
);

create policy "Users can query their own documents"
on documents for select to authenticated using (
  auth.uid() = created_by
);

create policy "Users can insert document sections"
on document_sections for insert to authenticated with check (
  (metadata->>'document_id')::bigint in (
    select id
    from documents
    where created_by = auth.uid()
  )
);

create policy "Users can update their own document sections"
on document_sections for update to authenticated using (
  (metadata->>'document_id')::bigint in (
    select id
    from documents
    where created_by = auth.uid()
  )
) with check (
  (metadata->>'document_id')::bigint in (
    select id
    from documents
    where created_by = auth.uid()
  )
);

create policy "Users can query their own document sections"
on document_sections for select to authenticated using (
  (metadata->>'document_id')::bigint in (
    select id
    from documents
    where created_by = auth.uid()
  )
);

create function private.handle_storage_update()
returns trigger
language plpgsql
as $$
declare
  document_id bigint;
  result int;
begin
  insert into documents (name, storage_object_id, created_by)
    values (new.path_tokens[2], new.id, new.owner)
    returning id into document_id;

  return null;
end
$$;

create trigger on_file_upload
  after insert on storage.objects
  for each row
  execute procedure private.handle_storage_update();
