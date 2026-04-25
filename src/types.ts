export interface Category {
  id: string;
  name: string;
}

export interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface Complement {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  subCategoryId: string;
  complements?: Complement[];
  featured: boolean;
  active: boolean;
  hasLength?: boolean;
  createdAt: any;
}

export interface Settings {
  id?: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  email: string;
  cnpj: string;
  ownerName: string;
  pixKey: string;
  logoUrl?: string;
  heroImageUrl?: string;
  freeShippingThreshold?: number;
}

export interface CartItem extends Product {
  quantity: number;
  selectedComplements?: Complement[];
  personalization?: string;
  selectedLength?: string;
}

export interface Order {
  id?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  };
  items: CartItem[];
  total: number;
  shippingCost: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: any;
  pixQrCode?: string;
}
