export function useZkVerify() {
    const onVerifyProof = async (
        proof: string,
        publicSignals: any,
        vk: any
    ): Promise<{ verified: boolean; error?: string; cancelled?: boolean; proofType?: string; txHash?: string; blockHash?: string }> => {
        try {
            if (!proof || !publicSignals || !vk) {
                throw new Error('Proof, public signals, or verification key is missing');
            }

            const proofData = proof;

            const { zkVerifySession } = await import('zkverifyjs');

            const session = await zkVerifySession.start().Testnet().withWallet();
            // Using risc0 proof here
            const { transactionResult } = await session.verify().risc0().execute(proofData, publicSignals, vk);

            let transactionInfo = null;
            try {
                transactionInfo = await transactionResult;
            } catch (error: unknown) {
                if ((error as Error).message.includes('Rejected by user')) {
                    return { verified: false, error: 'Transaction Rejected By User.' };
                }
                throw new Error(`Transaction failed: ${(error as Error).message}`);
            }

            if (transactionInfo && transactionInfo.attestationId) {
                return {
                    verified: true,
                    proofType: transactionInfo.proofType,
                    txHash: transactionInfo.txHash,
                    blockHash: transactionInfo.blockHash,
                };
            } else {
                throw new Error("Your proof isn't correct.");
            }
        } catch (error: unknown) {
            const errorMessage = (error as Error).message;
            return { verified: false, error: errorMessage };
        }
    };

    return { onVerifyProof };
}
