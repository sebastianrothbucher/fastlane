create table if not exists lanes (id text, typeName text, content text, version int default 1, createdAt text, updatedAt text);
create table if not exists limitedUse (laneId text, resId text, resOptionId text, count int default 1, createdAt text);
create table if not exists landings (id text, content text, version int default 1, createdAt text, updatedAt text);