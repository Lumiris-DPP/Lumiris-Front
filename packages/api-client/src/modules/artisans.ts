import type { Http } from '../core/http';
import type {
    ArtisanPauseRequest,
    ArtisanPhotoResponse,
    ArtisanProfileResponse,
    ArtisanPublicProfileResponse,
    ArtisanRegisterRequest,
    ArtisanVitrineUpdateRequest,
} from '../types/artisans';

export function artisansApi(http: Http) {
    return {
        me(): Promise<ArtisanProfileResponse> {
            return http.request<ArtisanProfileResponse>('/api/artisans/me');
        },
        register(req: ArtisanRegisterRequest): Promise<ArtisanProfileResponse> {
            return http.request<ArtisanProfileResponse>('/api/artisans/register', { method: 'POST', body: req });
        },
        signDeclaration(): Promise<ArtisanProfileResponse> {
            return http.request<ArtisanProfileResponse>('/api/artisans/sign-declaration', { method: 'POST' });
        },
        updateProfile(req: ArtisanVitrineUpdateRequest): Promise<ArtisanProfileResponse> {
            return http.request<ArtisanProfileResponse>('/api/artisans/me/profile', { method: 'PUT', body: req });
        },
        addPhoto(file: File): Promise<ArtisanPhotoResponse> {
            const form = new FormData();
            form.append('file', file);
            return http.request<ArtisanPhotoResponse>('/api/artisans/me/photos', { method: 'POST', body: form });
        },
        removePhoto(photoId: string): Promise<void> {
            return http.request<void>(`/api/artisans/me/photos/${photoId}`, { method: 'DELETE', skipJson: true });
        },
        // Congés : les pièces restent achetables, le délai d'expédition annoncé est allongé
        // jusqu'à la date de retour, visible sur la vitrine publique.
        pause(req: ArtisanPauseRequest): Promise<ArtisanProfileResponse> {
            return http.request<ArtisanProfileResponse>('/api/artisans/me/pause', { method: 'PUT', body: req });
        },
        resume(): Promise<ArtisanProfileResponse> {
            return http.request<ArtisanProfileResponse>('/api/artisans/me/pause', { method: 'DELETE' });
        },
        publish(): Promise<ArtisanProfileResponse> {
            return http.request<ArtisanProfileResponse>('/api/artisans/me/publish', { method: 'POST' });
        },
        getPublicBySlug(slug: string): Promise<ArtisanPublicProfileResponse> {
            return http.request<ArtisanPublicProfileResponse>(`/v1/artisans/${slug}`);
        },
    };
}
