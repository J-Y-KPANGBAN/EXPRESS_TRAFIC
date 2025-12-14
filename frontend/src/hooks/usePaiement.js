// frontend/src/hooks/usePaiement.js - OPTION AVANCÉE
import { useState, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import paiementService from "../modules/paiement/paiementService";

export const usePaiement = () => {
  const { id } = useParams();
  const paymentId = id;
  const navigate = useNavigate();
  const location = useLocation();

  const [state, setState] = useState({
    loading: true,
    paying: false,
    error: null,
    payment: null
  });

  const searchParams = new URLSearchParams(location.search);
  const canceled = searchParams.get("canceled");

  const loadStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const res = await paiementService.getPaymentDetails(paymentId);
      if (!res.data?.success) throw new Error(res.data?.message);
      
      setState(prev => ({ ...prev, payment: res.data.data, loading: false }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err.response?.data?.message || err.message, 
        loading: false 
      }));
    }
  }, [paymentId]);

  const handlePayWithStripe = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, paying: true, error: null }));
      
      const res = await paiementService.createStripeCheckout(paymentId, {
        successPath: paiementService.getSuccessUrl(paymentId),
        cancelPath: paiementService.getCancelUrl(paymentId),
      });

      if (!res.data?.success || !res.data?.url) throw new Error(res.data?.message);
      
      window.location.href = res.data.url;
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err.response?.data?.message || err.message,
        paying: false 
      }));
    }
  }, [paymentId]);

  return {
    ...state,
    paymentId,
    canceled,
    loadStatus,
    handlePayWithStripe,
    goToReservations: () => navigate("/historique"),
    goToHome: () => navigate("/")
  };
};