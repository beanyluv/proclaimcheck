import { useNavigate as useReactRouterNavigate, useLocation as useReactRouterLocation } from 'react-router-dom';

const FEATURE_SUBDOMAINS: Record<string, string> = {
  'unggah': '/unggah-berkas',
  'unggah-berkas': '/unggah-berkas',
  'analisis': '/verifikasi-berkas',
  'verifikasi': '/verifikasi-berkas',
  'verifikasi-berkas': '/verifikasi-berkas',
  'pelaporan': '/laporan',
  'laporan': '/laporan',
  'riwayat': '/riwayat',
};

export function isSubdomainRoutingEnabled() {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  // Disable subdomain routing on Vercel's default domains since they don't support wildcard subdomains
  if (hostname.includes('.vercel.app')) {
    return false;
  }
  return true;
}

export function getSubdomainInfo() {
  if (typeof window === 'undefined') {
    return { subdomain: '', baseDomain: '', targetPath: '' };
  }

  const hostname = window.location.hostname;
  
  if (!isSubdomainRoutingEnabled()) {
    return {
      subdomain: '',
      baseDomain: hostname,
      targetPath: '',
    };
  }
  
  let detectedSubdomain = '';
  for (const sub of Object.keys(FEATURE_SUBDOMAINS)) {
    if (hostname.startsWith(sub + '.')) {
      detectedSubdomain = sub;
      break;
    }
  }

  let baseDomain = hostname;
  if (detectedSubdomain) {
    baseDomain = hostname.substring(detectedSubdomain.length + 1);
  }

  const targetPath = detectedSubdomain ? FEATURE_SUBDOMAINS[detectedSubdomain] : '';

  return {
    subdomain: detectedSubdomain,
    baseDomain,
    targetPath,
  };
}

export function navigateWithSubdomain(path: string, options?: any) {
  if (typeof window === 'undefined') return { shouldRedirect: false, targetSubdomain: '' };

  if (!isSubdomainRoutingEnabled()) {
    return { shouldRedirect: false, targetSubdomain: '' };
  }

  const { subdomain: currentSubdomain, baseDomain } = getSubdomainInfo();
  const port = window.location.port ? `:${window.location.port}` : '';
  
  // Determine target subdomain
  let targetSubdomain = '';
  if (path.startsWith('/unggah-berkas')) {
    targetSubdomain = 'unggah';
  } else if (path.startsWith('/verifikasi-berkas')) {
    targetSubdomain = 'analisis';
  } else if (path.startsWith('/laporan')) {
    targetSubdomain = 'pelaporan';
  } else if (path.startsWith('/riwayat')) {
    targetSubdomain = 'riwayat';
  }

  // Check if we are already on the correct subdomain (no need for reload!)
  const isTargetSameAsCurrent = 
    (targetSubdomain === currentSubdomain) || 
    (!targetSubdomain && !currentSubdomain);

  if (isTargetSameAsCurrent) {
    // If same subdomain, use local client-side navigation
    return { shouldRedirect: false, targetSubdomain };
  }

  // Carry session over to the target domain/subdomain
  const sessionData = localStorage.getItem('currentUser');
  const sessionActive = localStorage.getItem('session-last-active');
  const urlObj = new URL(window.location.href);
  const queryParams = new URLSearchParams(urlObj.search);

  if (sessionData) {
    queryParams.set('session_sync', encodeURIComponent(sessionData));
  }
  if (sessionActive) {
    queryParams.set('session_active', sessionActive);
  }

  // Carry route state if any (like re-upload parameters)
  if (options?.state) {
    queryParams.set('nav_state', encodeURIComponent(JSON.stringify(options.state)));
  }

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const cleanPath = path.split('?')[0];
  const hash = window.location.hash;

  let newUrl = '';
  if (targetSubdomain) {
    newUrl = `${window.location.protocol}//${targetSubdomain}.${baseDomain}${port}${cleanPath}${queryString}${hash}`;
  } else {
    newUrl = `${window.location.protocol}//${baseDomain}${port}${cleanPath}${queryString}${hash}`;
  }

  window.location.href = newUrl;
  return { shouldRedirect: true, targetSubdomain };
}

// Wrapper useLocation hook to automatically parse serialized navigation state
export function useLocation() {
  const loc = useReactRouterLocation();
  
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(loc.search);
    const navState = params.get('nav_state');
    if (navState && !loc.state) {
      try {
        const parsed = JSON.parse(decodeURIComponent(navState));
        return {
          ...loc,
          state: parsed,
        };
      } catch (e) {
        console.error('Failed to parse nav_state from query params', e);
      }
    }
  }
  
  return loc;
}

// Wrapper useNavigate hook that intercepts and executes subdomain redirects when appropriate
export function useNavigate() {
  const navigate = useReactRouterNavigate();

  return (path: string, options?: any) => {
    // If it's a relative path, resolve it first
    if (!path.startsWith('/')) {
      navigate(path, options);
      return;
    }

    const { shouldRedirect } = navigateWithSubdomain(path, options);
    if (!shouldRedirect) {
      navigate(path, options);
    }
  };
}
