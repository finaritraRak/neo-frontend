// src/components/search/SearchResultsPage.tsx
import React, { useEffect, useState } from 'react';
import { BookOpen, Mountain, Users, ArrowLeft, Clock, Users as UsersIcon, MapPin, DollarSign } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

// ✅ VITE_API_BASE_URL contient déjà `/api`
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://dev.calm-adventure-tours.com/api';

export const SearchResultsPage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [id, setId] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resultType = params.get('type');
    const resultIdStr = params.get('id');

    if (!resultType || !resultIdStr) {
      setError('Données manquantes : type ou id manquant');
      setLoading(false);
      return;
    }

    const resultId = parseInt(resultIdStr, 10);
    if (isNaN(resultId)) {
      setError('ID invalide');
      setLoading(false);
      return;
    }

    setType(resultType);
    setId(resultId);

    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const fetchAllAndFind = async (endpoint: string) => {
      try {
        const res = await fetch(endpoint, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const items = Array.isArray(json) ? json : json.results;
        const found = items.find((item: any) => item.id === resultId);

        if (!found) throw new Error(`Élément avec ID ${resultId} non trouvé`);

        setData(found);
        setLoading(false);
      } catch (err: any) {
        console.error('❌ Erreur:', err);
        setError(`Échec du chargement: ${err.message}`);
        setLoading(false);
      }
    };

    // ✅ L'URL complète est dans VITE_API_BASE_URL
    // Donc on ne rajoute pas `/api` ici
    switch (resultType) {
      case 'blog':
        fetchAllAndFind(`${API_BASE_URL}/blog/posts/`);
        break;
      case 'tour':
        fetchAllAndFind(`${API_BASE_URL}/tours/`);
        break;
      case 'user':
        fetchAllAndFind(`${API_BASE_URL}/users/`);
        break;
      default:
        setError('Type inconnu');
        setLoading(false);
    }
  }, []);

  const goBack = () => window.history.back();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">Chargement du détail...</div>
    </div>
  );

  if (error) return (
    <div className="p-6">
      <Card>
        <div className="text-red-600 space-y-2">
          <p><strong>Erreur :</strong> {error}</p>
          <Button onClick={goBack} variant="ghost" size="sm">← Retour</Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        {type === 'blog' && <BookOpen className="w-8 h-8 text-green-600" />}
        {type === 'tour' && <Mountain className="w-8 h-8 text-blue-600" />}
        {type === 'user' && <Users className="w-8 h-8 text-purple-600" />}
        <h1 className="text-3xl font-bold text-gray-900">{data.title || data.name || `${data.first_name} ${data.last_name}`}</h1>
      </div>

      {/* Blog */}
      {type === 'blog' && data && (
        <Card className="overflow-hidden">
          {data.featured_image && (
            <img
              src={`https://dev.calm-adventure-tours.com${data.featured_image}`}
              alt={data.title}
              className="w-full h-64 object-cover"
            />
          )}
          <div className="p-6">
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span>Par {data.author_name}</span>
              <span>{new Date(data.created_at).toLocaleDateString('fr-FR')}</span>
              <Badge variant="secondary">{data.category_name}</Badge>
            </div>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: data.content }}
            />
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="outline">Statut: {data.status}</Badge>
              <Badge variant="outline">Temps de lecture: {data.read_time}</Badge>
              <Badge variant="outline">ID: {data.id}</Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Tour */}
      {type === 'tour' && data && (
        <Card className="overflow-hidden">
          {data.images?.length > 0 && (
            <img
              src={`https://dev.calm-adventure-tours.com${data.images[0].image}`}
              alt={data.name}
              className="w-full h-64 object-cover"
            />
          )}
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
              <Badge variant="primary">{data.category}</Badge>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {data.duration}</span>
              <span className="flex items-center gap-1"><UsersIcon className="w-4 h-4" /> {data.group_size} pers</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {data.location}</span>
            </div>
            <p className="text-lg text-gray-700 mb-4">{data.description}</p>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl font-bold text-blue-600">{data.price} €</span>
              {data.original_price !== data.price && (
                <span className="text-gray-500 line-through">{data.original_price} €</span>
              )}
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">Points forts</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              {(Array.isArray(data.highlights) ? data.highlights : []).map((h: string, i: number) => (
                <li key={i}>{h}</li>
              ))}
            </ul>

            <h3 className="font-semibold text-gray-900 mb-2">Itinéraire</h3>
            <div
              className="prose max-w-none mb-4"
              dangerouslySetInnerHTML={{ __html: data.itinerary }}
            />

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900">Inclus</h4>
                <ul className="list-disc list-inside text-gray-700">
                  {(Array.isArray(data.inclusions) ? data.inclusions : []).map((i: string, idx: number) => (
                    <li key={idx}>{i}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Non inclus</h4>
                <ul className="list-disc list-inside text-gray-700">
                  {(Array.isArray(data.exclusions) ? data.exclusions : []).map((e: string, idx: number) => (
                    <li key={idx}>{e}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* User */}
      {type === 'user' && data && (
        <Card className="p-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-medium text-gray-600">
              {data.first_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{data.first_name} {data.last_name}</h2>
              <p className="text-gray-600">{data.email}</p>
              <Badge variant={data.role === 'admin' ? 'danger' : 'secondary'} className="mt-1">
                {data.role}
              </Badge>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div><strong>ID:</strong> {data.id}</div>
            <div><strong>Status:</strong> {data.status}</div>
            <div><strong>Dernière connexion:</strong> {new Date(data.last_login).toLocaleString('fr-FR')}</div>
            <div><strong>Créé le:</strong> {new Date(data.created_at).toLocaleDateString('fr-FR')}</div>
          </div>
        </Card>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          onClick={() => {
            const url = type === 'blog' ? `/blog/edit/${id}` :
                       type === 'tour' ? `/tours/edit/${id}` :
                       `/users/edit/${id}`;
            window.location.href = `/admin-panel${url}`;
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Modifier
        </Button>
        <Button onClick={goBack} variant="outline">
          ← Retour
        </Button>
      </div>
    </div>
  );
};