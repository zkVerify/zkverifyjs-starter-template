import { useState } from 'react';
import { useAccount } from '@/context/AccountContext';

export function useZkVerify() {
    const { selectedAccount, selectedWallet } = useAccount();
    const [status, setStatus] = useState<string | null>(null);
    const [eventData, setEventData] = useState<any>(null);
    const [transactionResult, setTransactionResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const onVerifyProof = async (
        proof: string,
        publicSignals: any,
        vk: any
    ): Promise<void> => {
        try {
            if (!proof || !publicSignals || !vk) {
                throw new Error('Proof, public signals, or verification key is missing');
            }

            if (!selectedWallet || !selectedAccount) {
                throw new Error('Wallet or account is not selected');
            }

            const proofData = proof;
            const { zkVerifySession } = await import('zkverifyjs');
            const session = await zkVerifySession.start().Testnet().withWallet({
                source: selectedWallet,
                accountAddress: selectedAccount,
            });

            setStatus('verifying');
            setError(null);
            setTransactionResult(null);

            const { events, transactionResult } = await session.verify().risc0().execute({
                proofData: {
                    proof: proofData,
                    publicSignals: publicSignals,
                    vk: vk,
                    version: 'V1_0'
                }
            });

            events.on('includedInBlock', (data: any) => {
                setStatus('includedInBlock');
                setEventData(data);
            });

            let transactionInfo = null;
            try {
                transactionInfo = await transactionResult;
                setTransactionResult(transactionInfo);
            } catch (error: unknown) {
                if ((error as Error).message.includes('Rejected by user')) {
                    setError('Transaction Rejected By User.');
                    setStatus('cancelled');
                    return;
                }
                throw new Error(`Transaction failed: ${(error as Error).message}`);
            }

            if (transactionInfo && transactionInfo.attestationId) {
                setStatus('verified');
            } else {
                throw new Error("Your proof isn't correct.");
            }
        } catch (error: unknown) {
            const errorMessage = (error as Error).message;
            setError(errorMessage);
            setStatus('error');
        }
    };

    return { status, eventData, transactionResult, error, onVerifyProof };
}
