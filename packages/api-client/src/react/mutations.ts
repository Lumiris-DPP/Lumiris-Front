'use client';

import { useMutation, useQueryClient, type UseMutationOptions, type QueryKey } from '@tanstack/react-query';

export type IdField = 'id' | 'slug';

export interface EntityApi<T, TCreate, TUpdate, TId extends string | number> {
    create: (data: TCreate) => Promise<T>;
    update: (id: TId, data: TUpdate) => Promise<T>;
    delete: (id: TId) => Promise<void>;
}

export interface SubResourceKeys {
    all: () => QueryKey;
    list?: () => QueryKey;
    detail?: (id: string | number) => QueryKey;
}

type MutationOptions<TData, TVars> = Omit<UseMutationOptions<TData, Error, TVars>, 'mutationFn'>;

export function createSubResourceMutations<T, TCreate, TUpdate, TId extends string | number = string>(
    api: EntityApi<T, TCreate, TUpdate, TId>,
    keys: SubResourceKeys,
    idField: IdField = 'slug',
) {
    return {
        useCreate(options?: MutationOptions<T, TCreate>) {
            const queryClient = useQueryClient();
            return useMutation<T, Error, TCreate>({
                mutationFn: api.create,
                ...options,
                onSuccess: (...args) => {
                    queryClient.invalidateQueries({ queryKey: keys.all(), refetchType: 'active' });
                    return options?.onSuccess?.(...args);
                },
            });
        },

        useUpdate(options?: MutationOptions<T, { [K in IdField]?: TId } & { data: TUpdate }>) {
            const queryClient = useQueryClient();
            return useMutation<T, Error, { [K in IdField]?: TId } & { data: TUpdate }>({
                mutationFn: (variables) => {
                    const id = variables[idField] as TId;
                    return api.update(id, variables.data);
                },
                ...options,
                onSuccess: (...args) => {
                    const [data, variables] = args;
                    const id = variables[idField] as TId;
                    if (keys.detail) {
                        queryClient.setQueryData(keys.detail(id as string | number), data);
                    }
                    queryClient.invalidateQueries({
                        queryKey: keys.list ? keys.list() : keys.all(),
                        refetchType: 'active',
                    });
                    return options?.onSuccess?.(...args);
                },
            });
        },

        useDelete(options?: MutationOptions<void, TId>) {
            const queryClient = useQueryClient();
            return useMutation<void, Error, TId>({
                mutationFn: api.delete,
                ...options,
                onSuccess: (...args) => {
                    queryClient.invalidateQueries({ queryKey: keys.all(), refetchType: 'active' });
                    return options?.onSuccess?.(...args);
                },
            });
        },
    };
}
