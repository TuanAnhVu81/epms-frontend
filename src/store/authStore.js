import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

export const useAuthStore = create(
  // persist middleware: auto save/restore from localStorage
  persist(
    (set) => ({
      token: null,
      user: null, // shape: { username: string, roles: string[] }

      // login: decode JWT and extract username + roles + requirePasswordChange flag
      login: (token) => {
        const decoded = jwtDecode(token);

        // Backend (JwtServiceImpl) puts roles in 'roles' claim as an Array: ["ROLE_ADMIN"]
        // Fallback to 'scope' (Spring Security default) or 'authorities'
        let roles = [];
        if (Array.isArray(decoded.roles)) {
          roles = decoded.roles;
        } else if (typeof decoded.scope === 'string' && decoded.scope) {
          roles = decoded.scope.split(' ');
        } else if (typeof decoded.authorities === 'string') {
          roles = decoded.authorities.split(' ');
        }

        set({
          token,
          user: {
            username: decoded.sub,
            roles,
            // Flag set by backend when Admin creates account with default password
            requirePasswordChange: decoded.requirePasswordChange === true,
          },
        });
      },

      // logout: clear token and user info
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'epms-auth' } // localStorage key
  )
);
