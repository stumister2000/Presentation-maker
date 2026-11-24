-- Email verification, Google sign-in and photo credits.
alter table users add column email_verified_at timestamptz;
alter table users add column google_sub text;
create unique index users_google_sub_key on users (google_sub) where google_sub is not null;
alter table cards add column image_credit text not null default '';
