// En: frontend/src/app/services/variant-template.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// --- INTERFAZ ---
export interface VariantTemplate {
  _id: string;
  templateName: string;
  variantName: string;
  options: {
    name: string;
    priceModifier?: number;
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

  getTemplates(): Observable<VariantTemplate[]> {
    return this.http.get<VariantTemplate[]>(this.apiUrl);
  }

  createTemplate(
    templateData: Partial<Omit<VariantTemplate, '_id'>>
  ): Observable<VariantTemplate> {
    return this.http.post<VariantTemplate>(this.apiUrl, templateData);
  }

  updateTemplate(
    templateId: string,
    templateData: Partial<VariantTemplate>
  ): Observable<VariantTemplate> {
    return this.http.put<VariantTemplate>(
      `${this.apiUrl}/${templateId}`,
      templateData
    );
  }

  deleteTemplate(templateId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${templateId}`);
  }
}
