export interface RNFile {
  uri: string;
  name: string;
  type: string;
}

export interface UserRequestDTO {
  email: string;
  username: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phone: string;
  birthday: string; // ISO date string since DateOnly doesn't exist in JS

  // For file uploads
  frontId: RNFile;
  backId: RNFile;
  insurance: RNFile;

  // These are usually handled by the backend, but included for completeness
  frontIdPath?: string;
  backIdPath?: string;
  insurancePath?: string;
}

export interface SignInRequestDTO {
  username: string;
  password: string;
}
