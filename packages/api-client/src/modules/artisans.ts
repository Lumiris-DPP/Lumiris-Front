import type { Http } from '../core/http';
import type {
    ArtisanPhotoResponse,
    ArtisanProfileResponse,
    ArtisanPublicProfileResponse,
    ArtisanRegisterRequest,
    ArtisanVitrineUpdateRequest,
} from '../types/artisans';
import type { KybDetailsRequest, KybDocumentLabel, KybDocumentUploadOptions } from '../types/kyb';

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
        submitKyb(req: KybDetailsRequest): Promise<ArtisanProfileResponse> {
            return http.request<ArtisanProfileResponse>('/api/artisans/me/kyb', { method: 'PUT', body: req });
        },
        uploadKybDocument(
            label: KybDocumentLabel,
            file: File,
            options?: KybDocumentUploadOptions,
        ): Promise<ArtisanProfileResponse> {
            const form = new FormData();
            form.append('file', file);
            return http.request<ArtisanProfileResponse>(`/api/artisans/me/kyb/documents/${label}`, {
                method: 'POST',
                body: form,
                query: { expiresAt: options?.expiresAt },
            });
        },
        addPhoto(file: File): Promise<ArtisanPhotoResponse> {
            const form = new FormData();
            form.append('file', file);
            return http.request<ArtisanPhotoResponse>('/api/artisans/me/photos', { method: 'POST', body: form });
        },
        removePhoto(photoId: string): Promise<void> {
            return http.request<void>(`/api/artisans/me/photos/${photoId}`, { method: 'DELETE', skipJson: true });
        },
        publish(): Promise<ArtisanProfileResponse> {
            return http.request<ArtisanProfileResponse>('/api/artisans/me/publish', { method: 'POST' });
        },
        getPublicBySlug(slug: string): Promise<ArtisanPublicProfileResponse> {
            return http.request<ArtisanPublicProfileResponse>(`/v1/artisans/${slug}`);
        },
        listPublished(): Promise<ArtisanPublicProfileResponse[]> {
            return http.request<ArtisanPublicProfileResponse[]>('/v1/artisans');
        },
    };
}
