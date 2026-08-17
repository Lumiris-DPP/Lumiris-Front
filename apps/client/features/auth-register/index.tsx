'use client';

import { useState } from 'react';
import type { UserRole } from '@lumiris/types';
import { StepRole } from './step-role';
import { StepCredentials } from './step-credentials';
import { StepSuccess } from './step-success';

type Step = 'role' | 'credentials' | 'success';

const STEP_LABELS: Record<Step, string> = {
    role: 'Rôle',
    credentials: 'Informations',
    success: 'Confirmation',
};

const STEPS: Step[] = ['role', 'credentials', 'success'];

export function RegisterForm() {
    const [step, setStep] = useState<Step>('role');
    const [role, setRole] = useState<UserRole | null>(null);
    const [createdName, setCreatedName] = useState('');

    const stepIndex = STEPS.indexOf(step);

    return (
        <div className="flex flex-col gap-6">
            {/* Step indicator */}
            <div className="flex items-center gap-2">
                {STEPS.map((s, i) => (
                    <div key={s} className="flex flex-1 items-center gap-2">
                        <div className="flex flex-1 flex-col items-center gap-1">
                            <div
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold transition-colors ${
                                    i < stepIndex
                                        ? 'bg-lumiris-cyan text-white'
                                        : i === stepIndex
                                          ? 'bg-lumiris-cyan text-white ring-2 ring-lumiris-cyan/30 ring-offset-1'
                                          : 'bg-muted text-muted-foreground'
                                }`}
                            >
                                {i + 1}
                            </div>
                            <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                                {STEP_LABELS[s]}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div
                                className={`mb-4 h-px flex-1 transition-colors ${i < stepIndex ? 'bg-lumiris-cyan' : 'bg-border'}`}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Step content */}
            {step === 'role' && <StepRole selected={role} onSelect={setRole} onNext={() => setStep('credentials')} />}
            {step === 'credentials' && role !== null && (
                <StepCredentials
                    role={role}
                    onBack={() => setStep('role')}
                    onSuccess={(name) => {
                        setCreatedName(name);
                        setStep('success');
                    }}
                />
            )}
            {step === 'success' && role !== null && <StepSuccess name={createdName} role={role} />}
        </div>
    );
}
