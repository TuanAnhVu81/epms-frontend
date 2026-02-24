import { message } from 'antd';

// Map business error codes from backend → Vietnamese user-friendly messages
const ERROR_MESSAGES = {
  1001: 'Dữ liệu không hợp lệ.',
  1002: 'Tên đăng nhập đã tồn tại.',
  1003: 'Tên đăng nhập phải có ít nhất 3 ký tự.',
  1004: 'Mật khẩu phải có ít nhất 6 ký tự.',
  1005: 'Người dùng không tồn tại.',
  1007: 'Bạn không có quyền thực hiện thao tác này.',
  1008: 'Sai tên đăng nhập hoặc mật khẩu.',
  2001: 'Không tìm thấy nhà cung cấp.',
  2002: 'Mã nhà cung cấp đã tồn tại.',
  2003: 'Điểm đánh giá phải từ 1.0 đến 5.0.',
  2004: 'Mã số thuế đã tồn tại.',
  2101: 'Không tìm thấy vật tư.',
  2102: 'Mã vật tư đã tồn tại.',
  9999: 'Lỗi hệ thống, vui lòng thử lại.',
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
    msg = ERROR_MESSAGES[code] || data?.message || 'Đã xảy ra lỗi, vui lòng thử lại.';
  }

  message.error(msg);
}
