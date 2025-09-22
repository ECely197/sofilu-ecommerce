/**
 * @fileoverview Servicio de Plantillas de Variantes.
 * Gestiona las operaciones CRUD para las plantillas de variantes, que permiten
 * a los administradores crear conjuntos de variantes predefinidas rápidamente.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interfaz para el tipado de una plantilla de variante.
export interface VariantTemplate {
  _id: string;
  templateName: string;
  variantName: string;
  options: {
    name: string;
    image?: string;
    price?: number;
    stock?: number;
    costPrice?: number;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class VariantTemplateService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/variant-templates`;

  /** Obtiene todas las plantillas de variantes. */
  getTemplates(): Observable<VariantTemplate[]> {
    return this.http.get<VariantTemplate[]>(this.apiUrl);
  }

  /**
   * Crea una nueva plantilla.
   * @param templateData Los datos de la plantilla a crear.
   */
  createTemplate(
    templateData: Partial<Omit<VariantTemplate, '_id'>>
  ): Observable<VariantTemplate> {
    return this.http.post<VariantTemplate>(this.apiUrl, templateData);
  }

  /**
   * Actualiza una plantilla existente.
   * @param templateId El ID de la plantilla a actualizar.
   * @param templateData Los nuevos datos para la plantilla.
   */
  updateTemplate(
    templateId: string,
    templateData: Partial<VariantTemplate>
  ): Observable<VariantTemplate> {
    return this.http.put<VariantTemplate>(
      `${this.apiUrl}/${templateId}`,
      templateData
    );
  }

  /**
   * Elimina una plantilla.
   * @param templateId El ID de la plantilla a eliminar.
   */
  deleteTemplate(templateId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${templateId}`);
  }
}
