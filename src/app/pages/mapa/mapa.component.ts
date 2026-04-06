import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../components/layout/layout.component';

interface Veiculo {
  placa: string;
  motorista: string;
  lat: number;
  lng: number;
  endereco?: string;
}

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQFSD1FvUUna4yO62iDRBQSu4D1LXCLHIqPo24hNXeZ_pzwOM9JKIVfSPEHyT8L5Bef01y-hFNHKZyF/pub?gid=0&single=true&output=csv';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.css']
})
export class MapaComponent implements AfterViewInit, OnDestroy {
  filtro = '';
  dados: Veiculo[] = [];
  carregando = true;
  erro = '';

  private map: any = null;
  private markers: any[] = [];
  private cacheEndereco: Record<string, string> = {};
  private refreshInterval: any;
  private geocoderInterval: any;
  private scrollInterval: any;
  private scrollY = 0;
  private scrollPausado = false;

  ngAfterViewInit(): void {
    this.carregarLeaflet().then(() => {
      // Aguarda o layout flexbox calcular dimensões reais antes de inicializar o Leaflet
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.initMapa();
          this.carregar();
          this.refreshInterval = setInterval(() => this.carregar(), 10000);
          this.geocoderInterval = setInterval(() => this.loopGeocoder(), 60000);
          this.iniciarScroll();
        }, 100);
      });
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshInterval);
    clearInterval(this.geocoderInterval);
    clearInterval(this.scrollInterval);
    if (this.map) { this.map.remove(); this.map = null; }
  }

  private carregarLeaflet(): Promise<void> {
    const L = (window as any)['L'];
    if (L) return Promise.resolve();

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  private initMapa(): void {
    const L = (window as any)['L'];
    this.map = L.map('mapa-container', { preferCanvas: true }).setView([-20.3, -40.3], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // Força o Leaflet a recalcular dimensões em múltiplos momentos
    // para garantir que os tiles carregam independente do timing do CSS
    [100, 300, 600, 1000].forEach(ms =>
      setTimeout(() => this.map && this.map.invalidateSize(), ms)
    );
  }

  get filtrados(): Veiculo[] {
    const f = this.filtro.toUpperCase().trim();
    if (!f) return this.dados;
    return this.dados.filter(v => v.placa.includes(f));
  }

  private renderMarcadores(): void {
    const L = (window as any)['L'];
    if (!L || !this.map) return;

    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];

    const icon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048329.png',
      iconSize: [50, 50],
      iconAnchor: [25, 50]
    });

    this.filtrados.forEach(v => {
      const marker = L.marker([v.lat, v.lng], { icon }).addTo(this.map);
      marker.bindTooltip(v.placa, { permanent: true, direction: 'top', offset: [0, -45] });
      marker.on('click', () => this.centrarEm(v));
      this.markers.push(marker);
    });
  }

  centrarEm(v: Veiculo): void {
    if (this.map) this.map.setView([v.lat, v.lng], 13);
  }

  onFiltro(): void {
    this.scrollPausado = this.filtro.trim() !== '';
    this.scrollY = 0;
    this.renderMarcadores();
  }

  private parseCSV(text: string): Veiculo[] {
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const linhas = text.trim().split('\n');
    if (linhas.length < 2) return [];

    const split = (linha: string): string[] => {
      const cols: string[] = [];
      let dentro = false, atual = '';
      for (let i = 0; i < linha.length; i++) {
        const ch = linha[i];
        if (ch === '"') { if (dentro && linha[i+1] === '"') { atual += '"'; i++; } else { dentro = !dentro; } }
        else if (ch === ',' && !dentro) { cols.push(atual.trim()); atual = ''; }
        else { atual += ch; }
      }
      cols.push(atual.trim());
      return cols;
    };

    const resultado: Veiculo[] = [];
    for (let i = 1; i < linhas.length; i++) {
      const c = split(linhas[i].trim());
      if (c.length < 6) continue;
      const placa     = (c[1]||'').replace(/"/g,'').trim().toUpperCase();
      const motorista = (c[6]||'').replace(/"/g,'').trim();
      const lat       = parseFloat((c[4]||'').replace(',','.'));
      const lng       = parseFloat((c[5]||'').replace(',','.'));
      if (!placa || isNaN(lat) || isNaN(lng)) continue;
      resultado.push({ placa, motorista, lat, lng });
    }
    return resultado;
  }

  carregar(): void {
    this.carregando = this.dados.length === 0;
    fetch(CSV_URL)
      .then(r => r.text())
      .then(text => {
        this.dados = this.parseCSV(text).map(v => ({
          ...v,
          endereco: this.cacheEndereco[`${v.lat},${v.lng}`] || 'Localizando...'
        }));
        this.carregando = false;
        this.erro = '';
        this.renderMarcadores();
        this.loopGeocoder();
      })
      .catch(() => {
        this.carregando = false;
        this.erro = 'Não foi possível carregar os dados dos veículos.';
      });
  }

  private async loopGeocoder(): Promise<void> {
    for (const v of this.dados) {
      const chave = `${v.lat},${v.lng}`;
      if (this.cacheEndereco[chave]) { v.endereco = this.cacheEndereco[chave]; continue; }
      try {
        const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${v.lat}&longitude=${v.lng}&localityLanguage=pt`);
        const j = await r.json();
        const cidade = j.city || j.locality || '';
        const estado = j.principalSubdivision || '';
        this.cacheEndereco[chave] = cidade && estado ? `${cidade} / ${estado}` : (cidade || estado || 'Desconhecido');
        v.endereco = this.cacheEndereco[chave];
      } catch {
        this.cacheEndereco[chave] = 'Localização desconhecida';
        v.endereco = this.cacheEndereco[chave];
      }
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  private iniciarScroll(): void {
    const SPEED = 0.4;
    this.scrollInterval = setInterval(() => {
      if (this.scrollPausado) return;
      const el = document.getElementById('lista-veiculos');
      if (!el) return;
      const metade = el.scrollHeight / 2;
      this.scrollY += SPEED;
      if (this.scrollY >= metade) this.scrollY = 0;
      el.style.transform = `translateY(-${this.scrollY}px)`;
    }, 16);
  }
}
