-- Quanti soci della stagione in ogni file dei fogli: corsisti per giorno del corso (corso «NO» escluso), abbonati
-- per giorno (persone, non abbonamenti) e jolly. La partenza non conta.
with soci as (select * from public.members where enrolled_at is not null)
select json_build_object(
  'corsisti', (select coalesce(json_object_agg(course_day, n), '{}') from (select course_day, count(*) n from soci
                where course_type is not null and upper(course_type) <> 'NO' and course_day is not null group by course_day) c),
  'abbonati', (select coalesce(json_object_agg(day, n), '{}') from (select p.day, count(distinct p.member_id) n
                from public.pass_status p join soci s on s.id = p.member_id where p.day <> 'JOLLY' group by p.day) a),
  'jolly', (select count(distinct p.member_id) from public.pass_status p join soci s on s.id = p.member_id where p.day = 'JOLLY'));
