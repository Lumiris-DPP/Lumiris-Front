import { ScanPassport } from '@/features/scan-passport';
import { Splash } from '@/features/splash';

export default function Home() {
    return (
        <Splash>
            <ScanPassport />
        </Splash>
    );
}
