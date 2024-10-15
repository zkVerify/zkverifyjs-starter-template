'use client';
import React, { useState, useRef } from 'react';
import { useAccount } from '@/context/AccountContext';
import ConnectWalletButton, { ConnectWalletButtonHandle } from '../components/ConnectWalletButton';
import { useZkVerify } from '@/hooks/useZkVerify';
import styles from './page.module.css';
import proofData from '../proofs/risc0.json';
import Image from 'next/image';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<string | null>(null);
  const [proofType, setProofType] = useState<string | null>(null);
  const [blockHash, setBlockHash] = useState<string | null>(null);
  const walletButtonRef = useRef<ConnectWalletButtonHandle | null>(null);
  const { selectedAccount } = useAccount();
  const { onVerifyProof } = useZkVerify();

  const handleSubmit = async () => {
    if (!selectedAccount) {
      setVerificationResult('Please connect a wallet.');
      return;
    }

    setLoading(true);
    setVerificationResult(null);
    setProofType(null);
    setBlockHash(null);

    const { vk, publicSignals, proof } = proofData;

    try {
      const result = await onVerifyProof(proof, publicSignals, vk);

      if (result.verified) {
        setVerificationResult('Proof verified successfully!');
        setProofType(result.proofType || '');
        setBlockHash(result.blockHash || '');
      } else {
        setVerificationResult(`Verification failed: ${result.error}`);
      }
    } catch (error) {
      setVerificationResult(`Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const blockExplorerUrl = blockHash
      ? `https://testnet-explorer.zkverify.io/v0/block/${blockHash}`
      : null;

  return (
      <div className={styles.page}>
        <div className={styles.main}>
          <Image
              src="/zk_Verify_logo_full_black.png"
              alt="zkVerify Logo"
              width={450}
              height={150}
          />

          <ConnectWalletButton ref={walletButtonRef} onWalletConnected={() => {}} />

          <button
              onClick={handleSubmit}
              className={`button ${styles.verifyButton}`}
              disabled={!selectedAccount || loading}
          >
            {loading ? (
                <>
                  Submitting...
                  <div className={"spinner"}></div>
                </>
            ) : (
                'Submit Proof'
            )}
          </button>

          <div className={styles.resultContainer}>
            {verificationResult && (
                <p className={verificationResult.includes('failed') || verificationResult.includes('Error') ? styles.resultError : styles.resultSuccess}>
                  {verificationResult}
                </p>
            )}


            {proofType && (
                <div className={styles.resultSection}>
                  Proof Type: {proofType}
                </div>
            )}

            {blockExplorerUrl && (
                <div className={styles.resultLink}>
                  <a href={blockExplorerUrl} target="_blank" rel="noopener noreferrer">
                    View Transaction on Explorer
                  </a>
                </div>
            )}
          </div>
        </div>
      </div>
  );
}
