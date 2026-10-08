import { Link } from 'react-router-dom';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

const DEFAULT_OPENAPI_URL = 'https://raw.githubusercontent.com/benhammoush/iris-worker-api/main/openapi.yaml';
export const openApiUrl = import.meta.env.VITE_OPENAPI_URL || DEFAULT_OPENAPI_URL;

function ApiDocs() {
  return <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6">
    <div className="mx-auto mb-6 flex max-w-[1460px] items-center justify-between gap-4">
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-slate-500">IRIS API</p>
        <h1 className="text-2xl font-semibold">Interactive API documentation</h1>
      </div>
      <Link className="rounded border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100" to="/">Back to Iris</Link>
    </div>
    <div className="mx-auto max-w-[1460px] rounded bg-white p-3 shadow-sm sm:p-6">
      <SwaggerUI url={openApiUrl} deepLinking docExpansion="list" defaultModelsExpandDepth={-1} persistAuthorization={false} />
    </div>
  </main>;
}

export default ApiDocs;
