/**
 * Categories Repository
 * Handles expense category operations with caching
 */

import { BaseRepository } from './BaseRepository';
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@casha/shared';

// Cache TTL: 5 minutes (categories rarely change)
const CATEGORIES_CACHE_TTL = 5 * 60 * 1000;

class CategoriesRepositoryClass extends BaseRepository {
  /**
   * Get all categories for current user (with caching)
   */
  async getCategories(): Promise<Category[]> {
    return this.getWithCache<Category[]>(
      '/api/categories',
      'categories:all',
      CATEGORIES_CACHE_TTL
    );
  }

  /**
   * Get all categories without caching (for fresh data)
   */
  async getCategoriesFresh(): Promise<Category[]> {
    return this.get<Category[]>('/api/categories');
  }

  /**
   * Get a single category by ID (with caching)
   */
  async getCategory(id: string): Promise<Category> {
    return this.getWithCache<Category>(
      `/api/categories/${id}`,
      `category:${id}`,
      CATEGORIES_CACHE_TTL
    );
  }

  /**
   * Create a new category
   */
  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    const result = await this.post<Category>('/api/categories', data);
    await this.invalidateCache(['categories:*', 'category:*']);
    return result;
  }

  /**
   * Update an existing category
   */
  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category> {
    const result = await this.put<Category>(`/api/categories/${id}`, data);
    await this.invalidateCache(['categories:*', `category:${id}`]);
    return result;
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<void> {
    await this.delete(`/api/categories/${id}`);
    await this.invalidateCache(['categories:*', `category:${id}`]);
  }
}

// Export singleton instance
export const categoriesRepository = new CategoriesRepositoryClass();
