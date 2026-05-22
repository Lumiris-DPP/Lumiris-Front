'use client';

import { Suspense, memo } from 'react';
import { UserList } from './user-list';

function VisionUsersComponent() {
    return (
        <Suspense fallback={null}>
            <UserList />
        </Suspense>
    );
}

export const VisionUsers = memo(VisionUsersComponent);
