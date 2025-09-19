// admin-panel/src/hooks/useSeoAnalysis.ts
import { useState, useEffect } from 'react';
import axios from 'axios';

// Définir les types pour les résultats de l'analyse SEO
interface SeoCheck {
  
}

interface SeoAnalysisResult {
  score: number;
  gauge: 'red' | 'orange' | 'green';
  checks: SeoCheck; 
  suggestions: string[];
}

// Définir le type pour les données d'entrée de l'analyse
interface SeoInputData {
  title: string;
  content: string; // Contenu HTML
  meta_description: string;
  slug: string;
  focus_keyword: string;
  meta_title: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const SEO_ANALYSIS_ENDPOINT = `${API_BASE_URL}/seo/analyze-direct/`;

/**
 * Hook personnalisé pour effectuer l'analyse SEO en direct.
 * @param inputData Les données de l'article à analyser.
 * @param debounceMs Le délai de temporisation en millisecondes (par défaut 1000ms).
 * @returns L'état de l'analyse : résultat, chargement, erreur.
 */
export const useSeoAnalysis = (inputData: SeoInputData | null, debounceMs: number = 1000) => {
  const [result, setResult] = useState<SeoAnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!inputData) {
      setResult(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Fonction pour appeler l'API
    const analyzeSeo = async () => {
      setLoading(true);
      setError(null);
      try {
        // Préparer les données, en s'assurant qu'elles sont définies
        const dataToSend: SeoInputData = {
            title: inputData.title || '',
            content: inputData.content || '',
            meta_description: inputData.meta_description || '',
            slug: inputData.slug || '',
            focus_keyword: inputData.focus_keyword || '',
            meta_title: inputData.meta_title || inputData.title || '', // Fallback sur le titre
        };
        const response = await axios.post<SeoAnalysisResult>(SEO_ANALYSIS_ENDPOINT, dataToSend, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        setResult(response.data);
      } catch (err: any) {
        console.error("Erreur lors de l'analyse SEO:", err);
        // Fournir un message d'erreur plus clair
        const errorMessage = err.response?.data?.error || err.message || 'Erreur inconnue lors de l\'analyse SEO';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    // Temporisation (debouncing)
    const timerId = setTimeout(() => {
      analyzeSeo();
    }, debounceMs);

    // Nettoyage : annuler le timeout si les données changent trop vite
    return () => {
      clearTimeout(timerId);
    };
  }, [inputData, debounceMs]); 

  return { result, loading, error };
};