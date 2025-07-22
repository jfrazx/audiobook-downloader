import { useEffect } from 'react';
import { useGetStatusQuery } from '../../../features/auth/auth.api';
import { useNavigate } from 'react-router-dom';

export default function OidcCallback() {
  const { data: user, isLoading } = useGetStatusQuery({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/');
    }
  }, [isLoading, user, navigate]);

  return <div>Loading...</div>;
}
