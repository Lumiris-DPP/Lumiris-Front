import type { Http } from '../core/http';
import type { DashboardInfoDto } from '../types/dashboard';

export function dashboardApi(http: Http) {
    return {
        getInfo(): Promise<DashboardInfoDto> {
            return http.request<DashboardInfoDto>('/dashboard/info');
        },
    };
}
