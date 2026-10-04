import { STRINGS } from '@data/strings';
import { isAbsentOn, kindDefOf } from '@domain/staff';
import type { GameState, StaffKind, StaffMember, StaffNotice } from '@domain/models';

const T = STRINGS.staff;

export const kindName = (kind: StaffKind): string => T.kinds[kind]?.name ?? kind;

/** "rút vé đúng hạng, cân hành lý"; rỗng nếu bậc này không phụ trách việc nào. */
export const jobsText = (kind: StaffKind): string =>
  (kindDefOf(kind)?.jobs ?? []).map((job) => T.jobs[job] ?? job).join(', ');

const daysText = (remainingDays: number): string => (remainingDays <= 1 ? T.notice.daysOne : T.notice.daysMany.replace('{n}', String(remainingDays)));

const fill = (template: string, values: Record<string, string>): string =>
  Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template);

/** Dòng thông báo ở màn tổng kết (cho ngày mai). */
export const noticeText = (notice: StaffNotice, tomorrow: number): string => {
  if (notice.type === 'PROMOTED') return fill(T.notice.promoted, { name: notice.name });
  const jobs = jobsText(notice.kind);
  const template = notice.kind === 'MARKETING' ? T.notice.absentMarketing : jobs ? T.notice.absentWithJobs : T.notice.absentIntern;
  return fill(template, {
    name: notice.name,
    kind: kindName(notice.kind),
    reason: T.absence[notice.reason],
    days: daysText(notice.untilDay - tomorrow + 1),
    jobs,
  });
};

/** Dòng nhắc ở đầu ngày về các nhân viên nghỉ hôm nay. */
export const absentTodayLines = (state: Readonly<GameState>): string[] =>
  state.staff
    .filter((member) => isAbsentOn(member, state.day) && member.absenceReason !== null)
    .flatMap((member) =>
      member.kind === 'INTERN' || member.absenceReason === null
        ? []
        : [
            fill(member.kind === 'MARKETING' ? T.notice.todayAbsentMarketing : T.notice.todayAbsent, {
              name: member.name,
              kind: kindName(member.kind),
              reason: T.absence[member.absenceReason],
              jobs: jobsText(member.kind),
            }),
          ],
    );

export const memberDetail = (member: StaffMember): string => {
  const jobs = jobsText(member.kind);
  return jobs ? `${T.jobsPrefix}: ${jobs}` : T.noJobs;
};
