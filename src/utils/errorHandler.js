import { message } from 'antd';

// Map business error codes from backend → Vietnamese user-friendly messages
const ERROR_MESSAGES = {
  1001: 'Invalid data.',
  1002: 'Username already exists.',
  1003: 'Username must have at least 3 characters.',
  1004: 'Password must have at least 6 characters.',
  1005: 'User does not exist.',
  1007: "You don't have permission to perform this action.",
  1008: 'Incorrect username or password.',
  2001: 'Vendor not found.',
  2002: 'Vendor code already exists.',
  2003: 'Rating must be between 1.0 and 5.0.',
  2004: 'Tax ID already exists.',
  2101: 'Material not found.',
  2102: 'Material code already exists.',
  9999: 'System Error, please try again.',
};

// Show an error message toast based on the API error response
export function handleApiError(error) {
  const data = error?.response?.data;
  const code = data?.code;
  
  let msg = '';
  
  if (code === 1001 && data?.message) {
    // 1001 is generic 'Invalid Key' in BE, but message contains specific validation detail
    msg = data.message;
  } else {
    // Use mapped Vietnamese message if exists, otherwise fallback to BE message or generic
    msg = ERROR_MESSAGES[code] || data?.message || 'An error occurred, please try again.';
  }

  message.error(msg);
}
