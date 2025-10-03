-- Миграция: переводим name и description в courses и services на jsonb для мультиязычности
ALTER TABLE courses ALTER COLUMN name TYPE jsonb USING jsonb_build_object('ua', name);
ALTER TABLE courses ALTER COLUMN description TYPE jsonb USING jsonb_build_object('ua', description);

ALTER TABLE services ALTER COLUMN name TYPE jsonb USING jsonb_build_object('ua', name);
ALTER TABLE services ALTER COLUMN description TYPE jsonb USING jsonb_build_object('ua', description); 