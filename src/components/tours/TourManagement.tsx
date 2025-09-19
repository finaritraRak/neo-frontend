import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import { Plus, Edit, Trash2, X, Eye } from 'lucide-react';
// Remplacement de CKEditor par Tiptap
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import Blockquote from '@tiptap/extension-blockquote';
import OrderedList from '@tiptap/extension-ordered-list';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Modal } from '../ui/Modal';
// Interfaces mises à jour
interface TourImage {
  id: number;
  image: string;
  is_primary: boolean;
  created_at: string;
}
interface Tour {
  id: number;
  name: string;
  category: string;
  location: string;
  duration: string;
  group_size: string;
  images: TourImage[];
  price: number;
  original_price: number;
  rating: number;
  description: string;
  highlights: string[];
  difficulty: string;
  best_time: string;
  status?: 'published' | 'draft';
  views?: number;
  itinerary?: string;
  guide_languages?: string[];
  inclusions?: string[];
  exclusions?: string[];
  age_restriction?: string;
  availability?: string;
}
// Fonction utilitaire améliorée pour parser en toute sécurité les chaînes JSON
const safeJsonParse = <T,>(str: string | T | null | undefined, defaultValue: T): T => {
  if (typeof str === 'object' && Array.isArray(str)) return str as T;
  if (typeof str !== 'string') return defaultValue;
  // Nettoyer la chaîne si elle est échappée comme "\"[]\""
  let cleanedStr = str.trim();
  if (cleanedStr === '' || cleanedStr === 'null' || cleanedStr === 'undefined') {
    return defaultValue;
  }
  // Si la chaîne est entre guillemets et ressemble à une chaîne JSON échappée
  if (cleanedStr.startsWith('"[' && cleanedStr.endsWith(']"'))) {
    try {
      cleanedStr = JSON.parse(cleanedStr); // Convertit "\"[]\"" → []
    } catch (e) {
      // Si échec, on continue avec l'original
    }
  }
  try {
    const parsed = JSON.parse(cleanedStr);
    return Array.isArray(parsed) ? parsed : defaultValue;
  } catch (e) {
    console.warn('Failed to parse JSON string:', str, e);
    return defaultValue;
  }
};
// Fonction pour transformer les données de l'API en données utilisables
const transformTourData = (tour: any): Tour => {
  return {
    ...tour,
    highlights: safeJsonParse(tour.highlights, []),
    guide_languages: safeJsonParse(tour.guide_languages, []),
    inclusions: safeJsonParse(tour.inclusions, []),
    exclusions: safeJsonParse(tour.exclusions, []),
    status: tour.status || 'draft',
  };
};
export const TourManagement: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]); // ✅ Plusieurs fichiers
  const [uploadedImages, setUploadedImages] = useState<TourImage[]>([]); // ✅ Gérer les images uploadées
  const [newTour, setNewTour] = useState<Omit<Tour, 'id'> & { id: number }>({
    id: 0,
    name: '',
    category: '',
    location: '',
    duration: '',
    group_size: '',
    images: [],
    price: 0,
    original_price: 0,
    rating: 0,
    description: '',
    highlights: [],
    difficulty: '',
    best_time: '',
    status: 'draft',
    itinerary: '',
    guide_languages: [],
    inclusions: [],
    exclusions: [],
    age_restriction: '',
    availability: '',
  });
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  // ✅ État pour basculer entre vue visuelle et vue code
  const [isDescriptionHtmlView, setIsDescriptionHtmlView] = useState(false);
  const [isItineraryHtmlView, setIsItineraryHtmlView] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const PUBLIC_BASE_URL =
    (import.meta.env.VITE_PUBLIC_BASE_URL || API_BASE_URL.replace('/api', '') || 'http://localhost:8000').replace(/\/$/, '');
  const API_URL = `${API_BASE_URL}/tours/`;
  useEffect(() => {
    axios
      .get(API_URL)
      .then((response) => {
        console.log("Données brutes reçues de l'API:", response.data);
        const transformedTours = response.data.map(transformTourData);
        setTours(transformedTours);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Erreur lors du chargement des tours :', error);
        setLoading(false);
      });
  }, []);
  const getImageUrl = (imagePath: string): string => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const separator = imagePath.startsWith('/') ? '' : '/';
    return `${PUBLIC_BASE_URL}${separator}${imagePath}`;
  };
  // ✅ buildFormData mis à jour pour gérer plusieurs images et les is_primary
  const buildFormData = (tour: Omit<Tour, 'id'> & { id: number }) => {
    const formData = new FormData();
    formData.append('name', tour.name);
    formData.append('category', tour.category);
    formData.append('location', tour.location);
    formData.append('duration', tour.duration);
    formData.append('group_size', tour.group_size);
    formData.append('price', tour.price.toString());
    formData.append('original_price', tour.original_price.toString());
    formData.append('rating', tour.rating.toString());
    formData.append('description', isDescriptionHtmlView ? tour.description : descriptionEditor?.getHTML() || '');
    formData.append('difficulty', tour.difficulty);
    formData.append('best_time', tour.best_time);
    formData.append('highlights', JSON.stringify(tour.highlights));
    formData.append('status', tour.status || 'draft');
    formData.append('itinerary', isItineraryHtmlView ? tour.itinerary || '' : itineraryEditor?.getHTML() || '');
    formData.append('guide_languages', JSON.stringify(tour.guide_languages || []));
    formData.append('inclusions', JSON.stringify(tour.inclusions || []));
    formData.append('exclusions', JSON.stringify(tour.exclusions || []));
    formData.append('age_restriction', tour.age_restriction || '');
    formData.append('availability', tour.availability || '');
    // Ajout des nouvelles images
    imageFiles.forEach(file => {
      formData.append('images', file);
    });
    // Ajout des IDs des images existantes avec leur statut is_primary
    uploadedImages.forEach(img => {
      formData.append('existing_image_ids', img.id.toString());
      if (img.is_primary) {
        formData.append('primary_image_id', img.id.toString());
      }
    });
    return formData;
  };
  const handleDelete = (id: number) => {
    axios
      .delete(`${API_URL}${id}/`)
      .then(() => {
        setTours(tours.filter((tour) => tour.id !== id));
      })
      .catch((error) => {
        console.error('Erreur lors de la suppression du tour :', error);
      });
  };
  const handleAddTour = () => {
    if (newTour.name && newTour.category && newTour.price >= 0) {
      const formData = buildFormData(newTour);
      axios
        .post(API_URL, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        .then((response) => {
          const transformedTour = transformTourData(response.data);
          setTours([...tours, transformedTour]);
          resetForm();
        })
        .catch((error) => {
          console.error('Erreur lors de l\'ajout du tour :', error.response || error);
        });
    } else {
      console.warn('Veuillez remplir les champs obligatoires (Nom, Catégorie, Prix).');
    }
  };
  const handleEditTour = (tour: Tour) => {
    setEditingTour(tour);
    const transformedTour = transformTourData(tour);
    setNewTour(transformedTour);
    setUploadedImages([...tour.images]); // ✅ Charger les images existantes
    setIsDescriptionHtmlView(false);
    setIsItineraryHtmlView(false);
    setShowAddForm(true);
  };
  const handleSaveEdit = () => {
    if (editingTour) {
      const formData = buildFormData(newTour);
      axios
        .put(`${API_URL}${editingTour.id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        .then((response) => {
          const transformedTour = transformTourData(response.data);
          setTours(tours.map((tour) => (tour.id === transformedTour.id ? transformedTour : tour)));
          resetForm();
        })
        .catch((error) => {
          console.error('Erreur lors de la sauvegarde du tour :', error.response || error);
        });
    }
  };
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    field: keyof Tour
  ) => {
    const value = e.target.value;
    if (field === 'status') {
      setNewTour({
        ...newTour,
        [field]: value as 'published' | 'draft',
      });
    } else {
      setNewTour({
        ...newTour,
        [field]:
          field === 'price' || field === 'original_price' || field === 'rating'
            ? Number(value)
            : value,
      });
    }
  };
  // Éditeurs Tiptap pour Description et Itinéraire
  const descriptionEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
      Blockquote,
      OrderedList,
      HorizontalRule,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      FontFamily,
      TextStyle,
      Color,
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none min-h-[100px] p-3 border-none dark:bg-gray-800 dark:text-white',
      },
    },
    onUpdate: ({ editor }) => {
      setNewTour({ ...newTour, description: editor.getHTML() });
    },
  });
  const itineraryEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
      Blockquote,
      OrderedList,
      HorizontalRule,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      FontFamily,
      TextStyle,
      Color,
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none min-h-[100px] p-3 border-none dark:bg-gray-800 dark:text-white',
      },
    },
    onUpdate: ({ editor }) => {
      setNewTour({ ...newTour, itinerary: editor.getHTML() });
    },
  });
  // ✅ Synchronisation des éditeurs avec newTour à chaque changement
  useEffect(() => {
    if (editingTour && descriptionEditor && newTour.description) {
      // Éviter de réinitialiser si déjà bon contenu
      if (descriptionEditor.getHTML() !== newTour.description) {
        descriptionEditor.commands.setContent(newTour.description);
      }
    }
  }, [newTour.description, descriptionEditor, editingTour]);
  useEffect(() => {
    if (editingTour && itineraryEditor && newTour.itinerary) {
      if (itineraryEditor.getHTML() !== newTour.itinerary) {
        itineraryEditor.commands.setContent(newTour.itinerary || '');
      }
    }
  }, [newTour.itinerary, itineraryEditor, editingTour]);
  const handleHighlightChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const updatedHighlights = [...newTour.highlights];
    updatedHighlights[index] = e.target.value;
    setNewTour({
      ...newTour,
      highlights: updatedHighlights,
    });
  };
  const handleAddHighlight = () => {
    setNewTour({
      ...newTour,
      highlights: [...newTour.highlights, ''],
    });
  };
  const handleRemoveHighlight = (index: number) => {
    const updatedHighlights = newTour.highlights.filter((_, i) => i !== index);
    setNewTour({
      ...newTour,
      highlights: updatedHighlights,
    });
  };
  const handleGuideLanguageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const updatedLanguages = [...(newTour.guide_languages || [])];
    updatedLanguages[index] = e.target.value;
    setNewTour({
      ...newTour,
      guide_languages: updatedLanguages,
    });
  };
  const handleAddGuideLanguage = () => {
    setNewTour({
      ...newTour,
      guide_languages: [...(newTour.guide_languages || []), ''],
    });
  };
  const handleRemoveGuideLanguage = (index: number) => {
    const updatedLanguages = newTour.guide_languages?.filter((_, i) => i !== index) || [];
    setNewTour({
      ...newTour,
      guide_languages: updatedLanguages,
    });
  };
  const handleInclusionChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const updatedInclusions = [...(newTour.inclusions || [])];
    updatedInclusions[index] = e.target.value;
    setNewTour({
      ...newTour,
      inclusions: updatedInclusions,
    });
  };
  const handleAddInclusion = () => {
    setNewTour({
      ...newTour,
      inclusions: [...(newTour.inclusions || []), ''],
    });
  };
  const handleRemoveInclusion = (index: number) => {
    const updatedInclusions = newTour.inclusions?.filter((_, i) => i !== index) || [];
    setNewTour({
      ...newTour,
      inclusions: updatedInclusions,
    });
  };
  const handleExclusionChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const updatedExclusions = [...(newTour.exclusions || [])];
    updatedExclusions[index] = e.target.value;
    setNewTour({
      ...newTour,
      exclusions: updatedExclusions,
    });
  };
  const handleAddExclusion = () => {
    setNewTour({
      ...newTour,
      exclusions: [...(newTour.exclusions || []), ''],
    });
  };
  const handleRemoveExclusion = (index: number) => {
    const updatedExclusions = newTour.exclusions?.filter((_, i) => i !== index) || [];
    setNewTour({
      ...newTour,
      exclusions: updatedExclusions,
    });
  };
  const resetForm = () => {
    setShowAddForm(false);
    setEditingTour(null);
    setImageFiles([]);
    setUploadedImages([]);
    setIsDescriptionHtmlView(false);
    setIsItineraryHtmlView(false);
    setNewTour({
      id: 0,
      name: '',
      category: '',
      location: '',
      duration: '',
      group_size: '',
      images: [],
      price: 0,
      original_price: 0,
      rating: 0,
      description: '',
      highlights: [],
      difficulty: '',
      best_time: '',
      status: 'draft',
      itinerary: '',
      guide_languages: [],
      inclusions: [],
      exclusions: [],
      age_restriction: '',
      availability: '',
    });
    // Nettoyer les éditeurs
    if (descriptionEditor) {
      descriptionEditor.commands.setContent('');
    }
    if (itineraryEditor) {
      itineraryEditor.commands.setContent('');
    }
  };
  const openImageModal = (url: string) => {
    setModalImageUrl(url);
    setShowImageModal(true);
  };
  const closeImageModal = () => {
    setShowImageModal(false);
    setModalImageUrl(null);
  };
  const totalTours = tours.length;
  const publishedTours = tours.filter((tour) => tour.status === 'published').length;
  const draftTours = tours.filter((tour) => tour.status === 'draft').length;
  const totalViews = tours.reduce((sum, tour) => sum + (tour.views || 0), 0);
  const renderAddForm = () => (
    <Modal isOpen={showAddForm} onClose={resetForm}>
      <div className="fixed inset-0 p-0 m-0 rounded-none w-full h-full flex flex-col bg-white dark:bg-gray-900">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editingTour ? 'Modifier le Tour' : 'Ajouter un Tour'}
          </h3>
          <button onClick={resetForm} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
            <X />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { field: 'name', label: 'Nom', type: 'text' },
              { field: 'category', label: 'Catégorie', type: 'text' },
              { field: 'location', label: 'Lieu', type: 'text' },
              { field: 'price', label: 'Prix', type: 'number' },
              { field: 'original_price', label: "Prix d'origine", type: 'number' },
              { field: 'difficulty', label: 'Difficulté', type: 'text' },
              { field: 'best_time', label: 'Meilleur moment', type: 'text' },
              { field: 'duration', label: 'Durée', type: 'text' },
              { field: 'group_size', label: 'Taille du groupe', type: 'text' },
              { field: 'age_restriction', label: 'Restriction d\'âge', type: 'text' },
              { field: 'availability', label: 'Disponibilité', type: 'text' },
            ].map(({ field, label, type }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">{label}</label>
                <input
                  type={type}
                  value={(newTour as any)[field]}
                  onChange={(e) => handleInputChange(e, field as keyof Tour)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  {...(type === 'number' ? { min: '0' } : {})}
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Status</label>
              <select
                value={newTour.status}
                onChange={(e) => handleInputChange(e as any, 'status')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Images</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) {
                    setImageFiles(Array.from(e.target.files));
                  }
                }}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
          {(imageFiles.length > 0 || uploadedImages.length > 0) && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Images du tour</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {imageFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setImageFiles(imageFiles.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={12} />
                    </button>
                    <p className="text-xs text-center mt-1 dark:text-gray-400">Nouvelle</p>
                  </div>
                ))}
                {uploadedImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={getImageUrl(img.image)}
                      alt="Uploaded"
                      className={`w-full h-24 object-cover rounded-lg cursor-pointer ${img.is_primary ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => {
                        setUploadedImages(
                          uploadedImages.map((i) => ({
                            ...i,
                            is_primary: i.id === img.id,
                          }))
                        );
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setUploadedImages(uploadedImages.filter((i) => i.id !== img.id))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={12} />
                    </button>
                    <p className="text-xs text-center mt-1 dark:text-gray-400">
                      {img.is_primary ? 'Principale' : 'Cliquez pour définir'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Description</label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <div className="flex flex-wrap gap-1 p-1 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <button type="button" onClick={() => descriptionEditor?.chain().focus().toggleBold().run()} className={`px-2 py-1 text-xs rounded ${descriptionEditor?.isActive("bold") ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-600"}`}>Gras</button>
                <button type="button" onClick={() => descriptionEditor?.chain().focus().toggleItalic().run()} className={`px-2 py-1 text-xs rounded ${descriptionEditor?.isActive("italic") ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-600"}`}>Italique</button>
                <button type="button" onClick={() => descriptionEditor?.chain().focus().toggleUnderline().run()} className={`px-2 py-1 text-xs rounded ${descriptionEditor?.isActive("underline") ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-600"}`}>Souligné</button>
                <button type="button" onClick={() => descriptionEditor?.chain().focus().toggleHeading({ level: 1 }).run()} className={`px-2 py-1 text-xs rounded ${descriptionEditor?.isActive("heading", { level: 1 }) ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-600"}`}>H1</button>
                <button type="button" onClick={() => descriptionEditor?.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 text-xs rounded ${descriptionEditor?.isActive("heading", { level: 2 }) ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-600"}`}>H2</button>
                <button type="button" onClick={() => descriptionEditor?.chain().focus().toggleHeading({ level: 3 }).run()} className={`px-2 py-1 text-xs rounded ${descriptionEditor?.isActive("heading", { level: 3 }) ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-600"}`}>H3</button>
                <button type="button" onClick={() => descriptionEditor?.chain().focus().toggleBulletList().run()} className={`px-2 py-1 text-xs rounded ${descriptionEditor?.isActive("bulletList") ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-600"}`}>Liste</button>
                <button type="button" onClick={() => descriptionEditor?.chain().focus().toggleOrderedList().run()} className={`px-2 py-1 text-xs rounded ${descriptionEditor?.isActive("orderedList") ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-600"}`}>Numérotée</button>
                <button type="button" onClick={() => descriptionEditor?.chain().focus().setBlockquote().run()} className={`px-2 py-1 text-xs rounded ${descriptionEditor?.isActive("blockquote") ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-600"}`}>Citation</button>
                <button type="button" onClick={() => descriptionEditor?.chain().focus().setHorizontalRule().run()} className="px-2 py-1 text-xs hover:bg-gray-200 dark:hover:bg-gray-600">Ligne</button>
                <button type="button" onClick={() => descriptionEditor?.chain().focus().setTextAlign("left").run()} className="px-2 py-1 text-xs hover:bg-gray-200 dark:hover:bg-gray-600">Gauche</button>
                <button type="button" onClick={() => descriptionEditor?.chain().focus().setTextAlign("center").run()} className="px-2 py-1 text-xs hover:bg-gray-200 dark:hover:bg-gray-600">Centré</button>
                <button type="button" onClick={() => descriptionEditor?.chain().focus().setTextAlign("right").run()} className="px-2 py-1 text-xs hover:bg-gray-200 dark:hover:bg-gray-600">Droite</button>
                <input
                  type="color"
                  onInput={(e) => descriptionEditor?.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
                  className="h-6 w-6 rounded border-none"
                />
                <button
                  type="button"
                  onClick={() => setIsDescriptionHtmlView(!isDescriptionHtmlView)}
                  className={`px-2 py-1 text-xs rounded ${isDescriptionHtmlView ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'}`}
                >
                  {isDescriptionHtmlView ? 'Vue Visuelle' : 'Vue Code'}
                </button>
              </div>
              {isDescriptionHtmlView ? (
                <textarea
                  value={newTour.description}
                  onChange={(e) => setNewTour({ ...newTour, description: e.target.value })}
                  className="w-full font-mono text-sm p-3 min-h-[150px] max-h-[150px] overflow-auto border-none focus:outline-none dark:bg-gray-800 dark:text-white"
                  placeholder="Éditez le HTML ici..."
                />
              ) : (
                <div className="min-h-[150px] max-h-[150px] overflow-auto dark:bg-gray-800">
                  <EditorContent editor={descriptionEditor} />
                </div>
              )}
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Itinéraire</label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <div className="flex flex-wrap gap-1 p-1 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <button type="button" onClick={() => itineraryEditor?.chain().focus().toggleBold().run()} className={`px-2 py-1 text-xs rounded ${itineraryEditor?.isActive("bold") ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-600"}`}>Gras</button>
                <button type="button" onClick={() => itineraryEditor?.chain().focus().toggleItalic().run()} className={`px-2 py-1 text-xs rounded ${itineraryEditor?.isActive("italic") ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-600"}`}>Italique</button>
                <button type="button" onClick={() => itineraryEditor?.chain().focus().toggleUnderline().run()} className={`px-2 py-1 text-xs rounded ${itineraryEditor?.isActive("underline") ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-600"}`}>Souligné</button>
                <button type="button" onClick={() => itineraryEditor?.chain().focus().toggleHeading({ level: 1 }).run()} className={`px-2 py-1 text-xs rounded ${itineraryEditor?.isActive("heading", { level: 1 }) ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-600"}`}>H1</button>
                <button type="button" onClick={() => itineraryEditor?.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 text-xs rounded ${itineraryEditor?.isActive("heading", { level: 2 }) ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-600"}`}>H2</button>
                <button type="button" onClick={() => itineraryEditor?.chain().focus().toggleHeading({ level: 3 }).run()} className={`px-2 py-1 text-xs rounded ${itineraryEditor?.isActive("heading", { level: 3 }) ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-600"}`}>H3</button>
                <button type="button" onClick={() => itineraryEditor?.chain().focus().toggleBulletList().run()} className={`px-2 py-1 text-xs rounded ${itineraryEditor?.isActive("bulletList") ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-600"}`}>Liste</button>
                <button type="button" onClick={() => itineraryEditor?.chain().focus().toggleOrderedList().run()} className={`px-2 py-1 text-xs rounded ${itineraryEditor?.isActive("orderedList") ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-600"}`}>Numérotée</button>
                <button type="button" onClick={() => itineraryEditor?.chain().focus().setBlockquote().run()} className={`px-2 py-1 text-xs rounded ${itineraryEditor?.isActive("blockquote") ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-600"}`}>Citation</button>
                <button type="button" onClick={() => itineraryEditor?.chain().focus().setHorizontalRule().run()} className="px-2 py-1 text-xs hover:bg-gray-200 dark:hover:bg-gray-600">Ligne</button>
                <button type="button" onClick={() => itineraryEditor?.chain().focus().setTextAlign("left").run()} className="px-2 py-1 text-xs hover:bg-gray-200 dark:hover:bg-gray-600">Gauche</button>
                <button type="button" onClick={() => itineraryEditor?.chain().focus().setTextAlign("center").run()} className="px-2 py-1 text-xs hover:bg-gray-200 dark:hover:bg-gray-600">Centré</button>
                <button type="button" onClick={() => itineraryEditor?.chain().focus().setTextAlign("right").run()} className="px-2 py-1 text-xs hover:bg-gray-200 dark:hover:bg-gray-600">Droite</button>
                <input
                  type="color"
                  onInput={(e) => itineraryEditor?.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
                  className="h-6 w-6 rounded border-none"
                />
                <button
                  type="button"
                  onClick={() => setIsItineraryHtmlView(!isItineraryHtmlView)}
                  className={`px-2 py-1 text-xs rounded ${isItineraryHtmlView ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'}`}
                >
                  {isItineraryHtmlView ? 'Vue Visuelle' : 'Vue Code'}
                </button>
              </div>
              {isItineraryHtmlView ? (
                <textarea
                  value={newTour.itinerary || ''}
                  onChange={(e) => setNewTour({ ...newTour, itinerary: e.target.value })}
                  className="w-full font-mono text-sm p-3 min-h-[150px] max-h-[150px] overflow-auto border-none focus:outline-none dark:bg-gray-800 dark:text-white"
                  placeholder="Éditez le HTML ici..."
                />
              ) : (
                <div className="min-h-[150px] max-h-[150px] overflow-auto dark:bg-gray-800">
                  <EditorContent editor={itineraryEditor} />
                </div>
              )}
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Points forts</label>
            {newTour.highlights.map((highlight, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={highlight}
                  onChange={(e) => handleHighlightChange(e, index)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveHighlight(index)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddHighlight}
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mt-2 flex items-center gap-1"
            >
              <Plus size={16} /> Ajouter un point fort
            </button>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Langues des guides</label>
            {(newTour.guide_languages || []).map((language, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={language}
                  onChange={(e) => handleGuideLanguageChange(e, index)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveGuideLanguage(index)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddGuideLanguage}
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mt-2 flex items-center gap-1"
            >
              <Plus size={16} /> Ajouter une langue
            </button>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Inclusions</label>
            {(newTour.inclusions || []).map((inclusion, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={inclusion}
                  onChange={(e) => handleInclusionChange(e, index)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveInclusion(index)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddInclusion}
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mt-2 flex items-center gap-1"
            >
              <Plus size={16} /> Ajouter une inclusion
            </button>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Exclusions</label>
            {(newTour.exclusions || []).map((exclusion, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={exclusion}
                  onChange={(e) => handleExclusionChange(e, index)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveExclusion(index)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddExclusion}
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mt-2 flex items-center gap-1"
            >
              <Plus size={16} /> Ajouter une exclusion
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-4 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <Button onClick={editingTour ? handleSaveEdit : handleAddTour} icon={Plus}>
            {editingTour ? 'Sauvegarder' : 'Ajouter'}
          </Button>
          <Button onClick={resetForm} variant="outline" icon={Trash2}>
            Annuler
          </Button>
        </div>
      </div>
    </Modal>
  );
  const renderToursTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 px-4 text-sm font-medium text-gray-500 dark:text-gray-300">Image</th>
            <th className="text-left py-2 px-4 text-sm font-medium text-gray-500 dark:text-gray-300">Nom</th>
            <th className="text-left py-2 px-4 text-sm font-medium text-gray-500 dark:text-gray-300">Catégorie</th>
            <th className="text-left py-2 px-4 text-sm font-medium text-gray-500 dark:text-gray-300">Prix</th>
            <th className="text-left py-2 px-4 text-sm font-medium text-gray-500 dark:text-gray-300">Status</th>
            <th className="text-left py-2 px-4 text-sm font-medium text-gray-500 dark:text-gray-300">Vues</th>
            <th className="text-right py-2 px-4 text-sm font-medium text-gray-500 dark:text-gray-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tours.map((tour) => {
            const primaryOrFirstImage = tour.images?.find(img => img.is_primary) || tour.images?.[0];
            const imageUrl = primaryOrFirstImage ? getImageUrl(primaryOrFirstImage.image) : null;
            return (
              <tr key={tour.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-4 py-2 text-sm">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={tour.name}
                      className="w-16 h-12 object-cover cursor-pointer rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.warn(`Erreur de chargement de l'image pour le tour ${tour.id}:`, target.src);
                      }}
                      onClick={() => openImageModal(imageUrl)}
                    />
                  ) : (
                    <span className="text-gray-400 italic dark:text-gray-500">No image</span>
                  )}
                </td>
                <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">{tour.name}</td>
                <td className="px-4 py-2 text-sm dark:text-gray-300">{tour.category}</td>
                <td className="px-4 py-2 text-sm dark:text-gray-300">${tour.price}</td>
                <td className="px-4 py-2 text-sm">
                  {tour.status === 'published' ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      Publié
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                      Brouillon
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span>{tour.views ?? 0}</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-sm flex justify-end gap-1">
  <button
    onClick={() => handleEditTour(tour)}
    className="p-2 rounded-md text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    aria-label={`Modifier ${tour.name}`}
    title="Modifier"
  >
    <Edit className="w-4 h-4" />
  </button>
  <button
    onClick={() => handleDelete(tour.id)}
    className="p-2 rounded-md text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    aria-label={`Supprimer ${tour.name}`}
    title="Supprimer"
  >
    <Trash2 className="w-4 h-4" />
  </button>
</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {showImageModal && modalImageUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeImageModal}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full h-full max-w-6xl max-h-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition z-10"
              aria-label="Fermer l'image"
            >
              <X size={24} />
            </button>
            <div className="flex items-center justify-center h-full w-full">
              <img
                src={modalImageUrl}
                alt="Agrandissement du tour"
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gestion des Tours</h2>
        <Button onClick={() => setShowAddForm(true)} icon={Plus}>Ajouter un Tour</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-4 shadow-sm bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300">Total des Tours</h4>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-200 mt-1">{totalTours}</p>
        </Card>
        <Card className="p-4 shadow-sm bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
          <h4 className="text-sm font-medium text-green-700 dark:text-green-300">Tours publiés</h4>
          <p className="text-2xl font-bold text-green-900 dark:text-green-200 mt-1">{publishedTours}</p>
        </Card>
        <Card className="p-4 shadow-sm bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
          <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Brouillons</h4>
          <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-200 mt-1">{draftTours}</p>
        </Card>
        <Card className="p-4 shadow-sm bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
          <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300">Total des vues</h4>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-200 mt-1">{totalViews.toLocaleString()}</p>
        </Card>
      </div>
      {renderAddForm()}
      {renderToursTable()}
    </div>
  );
};