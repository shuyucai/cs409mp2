import { Link } from 'react-router-dom';
import { StatusMessage } from '../../components/StatusMessage/StatusMessage';

export function NotFound() {
  return (
    <StatusMessage title="Page not found" tone="error">
      <p>A wild 404 appeared! This page doesn’t exist.</p>
      <Link to="/">Back to list</Link>
    </StatusMessage>
  );
}
