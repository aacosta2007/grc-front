import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ValoracionPanel from '../components/valoracion/ValoracionPanel';

export default function ValoracionOrdenPage() {
  const { idOrden } = useParams();
  const navigate = useNavigate();
  return <ValoracionPanel idOrden={idOrden} onBack={() => navigate('/valoracion')} />;
}
