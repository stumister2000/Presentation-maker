-- Deck-wide text size (fix from replica-entrepreneur: whole-deck text size in one go).
alter table decks add column text_scale text not null default 'm' check (text_scale in ('s','m','l','xl'));
