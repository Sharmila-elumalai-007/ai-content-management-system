
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';

export interface SeoSuggestions {
  keywords: string[];
  metaDescription: string;
}

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private readonly ai: GoogleGenAI;

  constructor() {
    // The Applet environment is expected to provide process.env.API_KEY.
    // Do not modify this line to hardcode an API key.
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async getSummary(content: string): Promise<string> {
    const prompt = `Summarize the following text in one or two short paragraphs. The summary should be concise and capture the main points.\n\n---\n\n${content}`;
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text.trim();
    } catch (error) {
      console.error('Error fetching summary:', error);
      throw new Error('Failed to generate summary.');
    }
  }

  async getTitleSuggestions(content: string): Promise<string[]> {
    const prompt = `Based on the following text, suggest 5 creative and engaging titles. Return only the titles, each on a new line.\n\n---\n\n${content}`;
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      const text = response.text;
      return text.split('\n').map(t => t.replace(/^- /, '').trim()).filter(t => t.length > 0);
    } catch (error) {
      console.error('Error fetching title suggestions:', error);
      throw new Error('Failed to generate title suggestions.');
    }
  }

  async getGrammarSuggestion(content: string): Promise<string> {
    const prompt = `Proofread and correct the grammar and spelling of the following text. Only return the corrected text, without any additional comments or introductions.\n\n---\n\n${content}`;
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text.trim();
    } catch (error) {
      console.error('Error fetching grammar suggestion:', error);
      throw new Error('Failed to generate grammar suggestion.');
    }
  }

  async getSeoSuggestions(content: string): Promise<SeoSuggestions> {
    const prompt = `Analyze the following text for SEO. Provide a list of relevant keywords and a suggested meta description.\n\n---\n\n${content}`;
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              keywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'A list of 5-7 relevant SEO keywords.'
              },
              metaDescription: {
                type: Type.STRING,
                description: 'A concise and compelling meta description (150-160 characters) for search engines.'
              }
            },
            required: ['keywords', 'metaDescription']
          }
        }
      });
      const jsonText = response.text;
      return JSON.parse(jsonText) as SeoSuggestions;
    } catch (error) {
      console.error('Error fetching SEO suggestions:', error);
      throw new Error('Failed to generate SEO suggestions.');
    }
  }
}
