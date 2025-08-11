mport ttkbootstrap as ttk
from ttkbootstrap.constants import *
import math

# --- Stałe (bez zmian) ---
SKLADKA_EMERYTALNA_UOP = 0.0976; SKLADKA_RENTOWA_UOP = 0.0150; SKLADKA_CHOROBOWA_UOP = 0.0245
SUMA_SKLADEK_SPOLECZNYCH_UOP = SKLADKA_EMERYTALNA_UOP + SKLADKA_RENTOWA_UOP + SKLADKA_CHOROBOWA_UOP
KUP_MIESIECZNIE_UOP = 250.00; WSPOLCZYNNIK_URLOPOWY_2025 = 20.75
SKLADKA_EMERYTALNA_ZLEC = 0.0976; SKLADKA_RENTOWA_ZLEC = 0.0150; SKLADKA_CHOROBOWA_ZLEC_DOBROWOLNA = 0.0245
KUP_ZLECENIE_PROCENT = 0.20; SKLADKA_ZDROWOTNA_PROCENT = 0.09; STAWKA_PIT = 0.12
PPK_PRACOWNIK_STAWKA = 0.02; KWOTA_ZMNIEJSZAJACA_MIESIECZNIE = 300.00; STAWKA_WYNAGRODZENIA_CHOROBOWEGO = 0.80
STAWKI_NOCNE_2025 = {"Styczeń": 5.55, "Luty": 5.83, "Marzec": 5.55, "Kwiecień": 5.55, "Maj": 5.83, "Czerwiec": 5.83, "Lipiec": 5.07, "Sierpień": 5.83, "Wrzesień": 5.30, "Październik": 5.07, "Listopad": 6.48, "Grudzień": 5.83}

# --- Funkcje pomocnicze GUI ---
def aktualizuj_wyswietlana_stawke(event=None):
    wybrany_miesiac = combobox_miesiac.get(); stawka = STAWKI_NOCNE_2025[wybrany_miesiac]; label_wyswietlana_stawka.config(text=f"Dodatek: {stawka:.2f} zł/h")

def zmien_tryb_wprowadzania_uop():
    if tryb_rozliczenia_var.get() == "godzinowa":
        label_stawka_lub_kwota.config(text="Stawka godzinowa brutto (zł):"); obliczona_stawka_frame.grid_remove()
    else:
        label_stawka_lub_kwota.config(text="Miesięczna kwota brutto (zł):"); obliczona_stawka_frame.grid(row=2, column=0, columnspan=3, sticky=W, padx=15, pady=(5, 0)); label_obliczona_stawka_wartosc.config(text="0.00 zł/h")

def zmien_tryb_wprowadzania_zlecenie():
    if zlecenie_tryb_var.get() == "godzinowa":
        label_zlecenie_stawka_lub_kwota.config(text="Stawka godzinowa brutto (zł):")
        obliczona_stawka_frame_zlecenie.pack_forget()
    else:
        label_zlecenie_stawka_lub_kwota.config(text="Miesięczna kwota brutto (zł):")
        obliczona_stawka_frame_zlecenie.pack(fill=X, padx=15, pady=(0, 10), before=zlecenie_praca_frame)
        label_obliczona_stawka_wartosc_zlecenie.config(text="0.00 zł/h")

# --- Główna funkcja obliczeniowa ---
def oblicz_wyplate():
    try:
        def get_float(entry): val = entry.get().replace(',', '.'); return float(val) if val else 0.0
        def get_int(entry): val = entry.get().replace(',', '.'); return int(float(val)) if val else 0
        for key in wyniki_labels: wyniki_labels[key].config(text="0.00 zł")
        
        aktywna_zakladka_index = notebook.index(notebook.select())
        if aktywna_zakladka_index == 1:
            #... (logika dla zlecenia bez zmian) ...
            brutto = 0.0
            liczba_zmian_zlecenie = get_int(entry_zlecenie_zmian); dlugosc_zmiany_zlecenie = int(zlecenie_dlugosc_zmiany_var.get()); liczba_godzin_zlecenie = liczba_zmian_zlecenie * dlugosc_zmiany_zlecenie
            if zlecenie_tryb_var.get() == "godzinowa":
                stawka_godzinowa = get_float(entry_zlecenie_stawka_lub_kwota); brutto = stawka_godzinowa * liczba_godzin_zlecenie
            else:
                brutto = get_float(entry_zlecenie_stawka_lub_kwota)
                if liczba_godzin_zlecenie > 0:
                    obliczona_stawka = brutto / liczba_godzin_zlecenie; label_obliczona_stawka_wartosc_zlecenie.config(text=f"{obliczona_stawka:.2f} zł/h")
                else: label_obliczona_stawka_wartosc_zlecenie.config(text="Wpisz liczbę zmian!")
            if brutto == 0: return
            jest_studentem = opcja_student.get()
            if jest_studentem:
                wyniki_labels["przychód_miesiąc"].config(text=f"{brutto:.2f} zł"); wyniki_labels["netto"].config(text=f"{brutto:.2f} zł"); return
            dobrowolne_chorobowe = opcja_chorobowe_zlecenie.get(); stosuj_kwote_zmn = opcja_kwota_zmn_zlecenie.get(); czy_pit_zero_zlecenie = opcja_pit_zero_zlecenie.get()
            podstawa_zus = brutto; skladka_emerytalna_kwota = podstawa_zus * SKLADKA_EMERYTALNA_ZLEC; skladka_rentowa_kwota = podstawa_zus * SKLADKA_RENTOWA_ZLEC; skladka_chorobowa_kwota = podstawa_zus * SKLADKA_CHOROBOWA_ZLEC_DOBROWOLNA if dobrowolne_chorobowe else 0.0; suma_skladek_spolecznych_kwota = skladka_emerytalna_kwota + skladka_rentowa_kwota + skladka_chorobowa_kwota
            podstawa_skladki_zdrowotnej = brutto - suma_skladek_spolecznych_kwota; skladka_zdrowotna_kwota = podstawa_skladki_zdrowotnej * SKLADKA_ZDROWOTNA_PROCENT
            zaliczka_na_pit = 0.0; podstawa_opodatkowania_przed_zaokr = 0
            if not czy_pit_zero_zlecenie:
                koszty_uzyskania_przychodu = (brutto - suma_skladek_spolecznych_kwota) * KUP_ZLECENIE_PROCENT; podstawa_opodatkowania_przed_zaokr = brutto - suma_skladek_spolecznych_kwota - koszty_uzyskania_przychodu
                podstawa_opodatkowania = math.floor(podstawa_opodatkowania_przed_zaokr) if podstawa_opodatkowania_przed_zaokr > 0 else 0; podatek = podstawa_opodatkowania * STAWKA_PIT
                if stosuj_kwote_zmn: podatek -= KWOTA_ZMNIEJSZAJACA_MIESIECZNIE
                zaliczka_na_pit = math.floor(podatek) if podatek > 0 else 0.0
            suma_potracen = suma_skladek_spolecznych_kwota + skladka_zdrowotna_kwota + zaliczka_na_pit; wynagrodzenie_netto = brutto - suma_potracen
            wyniki_labels["emerytalna"].config(text=f"{skladka_emerytalna_kwota:.2f} zł"); wyniki_labels["rentowa"].config(text=f"{skladka_rentowa_kwota:.2f} zł"); wyniki_labels["chorobowa"].config(text=f"{skladka_chorobowa_kwota:.2f} zł"); wyniki_labels["zdrowotna"].config(text=f"{skladka_zdrowotna_kwota:.2f} zł"); wyniki_labels["suma_potracen"].config(text=f"{suma_potracen:.2f} zł"); wyniki_labels["przychód_miesiąc"].config(text=f"{brutto:.2f} zł"); wyniki_labels["podstawa_zus"].config(text=f"{podstawa_zus:.2f} zł"); wyniki_labels["podstawa_zdrowotna"].config(text=f"{podstawa_skladki_zdrowotnej:.2f} zł"); wyniki_labels["podstawa_opodatkowania"].config(text=f"{podstawa_opodatkowania_przed_zaokr:.2f} zł"); wyniki_labels["zaliczka_pit"].config(text=f"{zaliczka_na_pit:.2f} zł"); wyniki_labels["netto"].config(text=f"{wynagrodzenie_netto:.2f} zł")
        else:
            # Pobieranie danych dla UoP
            godziny_na_zmianie = int(dlugosc_zmiany_var.get())
            zmiany_dzienne = get_int(entries["Ilość zmian dziennych:"]); zmiany_nocne = get_int(entries["Ilość zmian nocnych:"]); dni_l4 = get_int(entries["Dni na L4 (80%):"]); premia_brutto = get_float(entries["Premia brutto (zł):"]); nadgodziny_dzienne = get_int(entries["Nadgodziny dzienne (+50%):"])
            nadgodziny_nocne = get_int(entries["Nadgodziny nocne (+50%):"]) # ZMIANA W POBIERANIU
            nadgodziny_nocne_niedziela = get_int(entries["Nadgodziny nocne w niedzielę (+100%):"]); niewykorzystane_dni_urlopu = get_int(entries["Niewykorzystane dni urlopu:"])
            
            stawka_godzinowa = 0; wynagrodzenie_podstawowe = 0; miesieczna_kwota_brutto_z_umowy = 0
            if tryb_rozliczenia_var.get() == "godzinowa":
                stawka_godzinowa = get_float(entry_stawka_lub_kwota); wynagrodzenie_podstawowe = (zmiany_dzienne + zmiany_nocne) * godziny_na_zmianie * stawka_godzinowa; miesieczna_kwota_brutto_z_umowy = wynagrodzenie_podstawowe
            else:
                kwota_brutto_miesieczna = get_float(entry_stawka_lub_kwota); wynagrodzenie_podstawowe = kwota_brutto_miesieczna; miesieczna_kwota_brutto_z_umowy = kwota_brutto_miesieczna
                standardowe_godziny = (zmiany_dzienne + zmiany_nocne) * godziny_na_zmianie
                if standardowe_godziny > 0: stawka_godzinowa = kwota_brutto_miesieczna / standardowe_godziny; label_obliczona_stawka_wartosc.config(text=f"{stawka_godzinowa:.2f} zł/h")
                else: label_obliczona_stawka_wartosc.config(text="Wpisz liczbę zmian!")
            
            dodatek_za_prace_nocna = (zmiany_nocne * godziny_na_zmianie) * STAWKI_NOCNE_2025[combobox_miesiac.get()]
            
            # POPRAWKA W OBLICZENIACH NADGODZIN
            wynagrodzenie_za_ng = (nadgodziny_dzienne * stawka_godzinowa * 1.5) + (nadgodziny_nocne * stawka_godzinowa * 1.5) + (nadgodziny_nocne_niedziela * stawka_godzinowa * 2.0)
            
            wynagrodzenie_za_prace = wynagrodzenie_podstawowe + premia_brutto + dodatek_za_prace_nocna + wynagrodzenie_za_ng
            ekwiwalent_brutto = (wynagrodzenie_za_prace / WSPOLCZYNNIK_URLOPOWY_2025) * niewykorzystane_dni_urlopu if niewykorzystane_dni_urlopu > 0 and wynagrodzenie_za_prace > 0 else 0.0
            podstawa_skladek_spolecznych_uop = wynagrodzenie_za_prace + ekwiwalent_brutto
            wynagrodzenie_chorobowe = ((miesieczna_kwota_brutto_z_umowy * (1 - SUMA_SKLADEK_SPOLECZNYCH_UOP)) / 30) * dni_l4 * STAWKA_WYNAGRODZENIA_CHOROBOWEGO if dni_l4 > 0 and miesieczna_kwota_brutto_z_umowy > 0 else 0.0
            wynagrodzenie_brutto_uop = podstawa_skladek_spolecznych_uop + wynagrodzenie_chorobowe
            skladka_emerytalna_kwota = podstawa_skladek_spolecznych_uop * SKLADKA_EMERYTALNA_UOP; skladka_rentowa_kwota = podstawa_skladek_spolecznych_uop * SKLADKA_RENTOWA_UOP; skladka_chorobowa_kwota = podstawa_skladek_spolecznych_uop * SKLADKA_CHOROBOWA_UOP; suma_skladek_spolecznych_kwota = skladka_emerytalna_kwota + skladka_rentowa_kwota + skladka_chorobowa_kwota
            podstawa_skladki_zdrowotnej = (podstawa_skladek_spolecznych_uop - suma_skladek_spolecznych_kwota) + wynagrodzenie_chorobowe
            skladka_zdrowotna_kwota = podstawa_skladki_zdrowotnej * SKLADKA_ZDROWOTNA_PROCENT; czy_ppk = opcja_ppk_uop.get()
            skladka_ppk_kwota = wynagrodzenie_brutto_uop * PPK_PRACOWNIK_STAWKA if czy_ppk else 0.0
            darowizny_miesiecznie = get_float(ulgi_entries["Darowizny (kwota mies.)"]); internet_miesiecznie = get_float(ulgi_entries["Ulga na internet (kwota mies.)"]); ulgi_od_dochodu = darowizny_miesiecznie + internet_miesiecznie
            podstawa_opodatkowania_przed_zaokr = wynagrodzenie_brutto_uop - suma_skladek_spolecznych_kwota - KUP_MIESIECZNIE_UOP - ulgi_od_dochodu
            podstawa_opodatkowania = math.floor(podstawa_opodatkowania_przed_zaokr) if podstawa_opodatkowania_przed_zaokr > 0 else 0; zaliczka_na_pit = 0.0
            if not (opcja_pit_zero_uop.get() or opcja_ulga_seniora.get() or opcja_ulga_4plus.get()):
                podatek = (podstawa_opodatkowania * STAWKA_PIT) - KWOTA_ZMNIEJSZAJACA_MIESIECZNIE
                podatek_po_uldze_na_dziecko = podatek - get_float(ulgi_entries["Ulga na dziecko (kwota mies.)"])
                if podatek_po_uldze_na_dziecko > 0: zaliczka_na_pit = math.floor(podatek_po_uldze_na_dziecko)
            suma_potracen = suma_skladek_spolecznych_kwota + skladka_zdrowotna_kwota + zaliczka_na_pit + skladka_ppk_kwota; wynagrodzenie_netto = wynagrodzenie_brutto_uop - suma_potracen
            wyniki_labels["emerytalna"].config(text=f"{skladka_emerytalna_kwota:.2f} zł"); wyniki_labels["rentowa"].config(text=f"{skladka_rentowa_kwota:.2f} zł"); wyniki_labels["chorobowa"].config(text=f"{skladka_chorobowa_kwota:.2f} zł"); wyniki_labels["ppk"].config(text=f"{skladka_ppk_kwota:.2f} zł"); wyniki_labels["zdrowotna"].config(text=f"{skladka_zdrowotna_kwota:.2f} zł"); wyniki_labels["suma_potracen"].config(text=f"{suma_potracen:.2f} zł"); wyniki_labels["przychód_miesiąc"].config(text=f"{wynagrodzenie_brutto_uop:.2f} zł"); wyniki_labels["podstawa_zus"].config(text=f"{podstawa_skladek_spolecznych_uop:.2f} zł"); wyniki_labels["podstawa_zdrowotna"].config(text=f"{podstawa_skladki_zdrowotnej:.2f} zł"); wyniki_labels["podstawa_opodatkowania"].config(text=f"{podstawa_opodatkowania_przed_zaokr:.2f} zł"); wyniki_labels["zaliczka_pit"].config(text=f"{zaliczka_na_pit:.2f} zł"); wyniki_labels["netto"].config(text=f"{wynagrodzenie_netto:.2f} zł")
    except Exception as e: print(f"Błąd krytyczny: {e}")

# --- Tworzenie okna i GUI ---
window = ttk.Window(themename="litera"); window.title("Kalkulator Wynagrodzeń"); window.geometry("800x950")
style = ttk.Style(); style.configure('Outer.TFrame', background=style.colors.light)
background_frame = ttk.Frame(window, style='Outer.TFrame'); background_frame.pack(fill=BOTH, expand=True, padx=30, pady=30)
canvas = ttk.Canvas(background_frame, highlightthickness=0, borderwidth=0); canvas.pack(side=LEFT, fill=BOTH, expand=True)
scrollbar = ttk.Scrollbar(background_frame, orient=VERTICAL, command=canvas.yview, bootstyle="primary-round"); scrollbar.pack(side=RIGHT, fill=Y)
canvas.configure(yscrollcommand=scrollbar.set)
scrollable_frame = ttk.Frame(canvas, padding=30)
canvas_frame_id = canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
def update_scrollregion(event): canvas.configure(scrollregion=canvas.bbox("all"))
def update_frame_width(event): canvas.itemconfig(canvas_frame_id, width=event.width)
scrollable_frame.bind("<Configure>", update_scrollregion); canvas.bind("<Configure>", update_frame_width)
def _on_mousewheel(event): canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")
canvas.bind_all("<MouseWheel>", _on_mousewheel)

ttk.Label(scrollable_frame, text="Kalkulator Wynagrodzeń", font=("Helvetica", 16, "bold")).pack(anchor=W, pady=(0, 10))
notebook = ttk.Notebook(scrollable_frame, bootstyle="primary"); notebook.pack(fill=X, expand=True, pady=10)
uop_tab = ttk.Frame(notebook, padding=10); zlecenie_tab = ttk.Frame(notebook, padding=10)
notebook.add(uop_tab, text="Umowa o pracę"); notebook.add(zlecenie_tab, text="Umowa Zlecenie")

# --- Sekcja UMOWY O PRACĘ ---
uop_input_frame = ttk.Labelframe(uop_tab, text="Dane Wejściowe", bootstyle="primary"); uop_input_frame.pack(fill=X, expand=True); uop_input_frame.columnconfigure(1, weight=1)
top_line_frame = ttk.Frame(uop_input_frame); top_line_frame.grid(row=0, column=0, columnspan=3, sticky=EW, pady=(10, 15), padx=15)
ttk.Label(top_line_frame, text="Miesiąc rozliczenia:", font="-weight bold").pack(side=LEFT)
combobox_miesiac = ttk.Combobox(top_line_frame, values=list(STAWKI_NOCNE_2025.keys()), state='readonly', width=12); combobox_miesiac.pack(side=LEFT, padx=10); combobox_miesiac.current(6)
label_wyswietlana_stawka = ttk.Label(top_line_frame, bootstyle="primary", font="-weight bold"); label_wyswietlana_stawka.pack(side=LEFT)
combobox_miesiac.bind("<<ComboboxSelected>>", aktualizuj_wyswietlana_stawke); aktualizuj_wyswietlana_stawke()
input_mode_frame = ttk.Frame(uop_input_frame); input_mode_frame.grid(row=1, column=0, columnspan=3, sticky=W, padx=15, pady=(0, 5))
tryb_rozliczenia_var = ttk.StringVar(value="godzinowa")
ttk.Radiobutton(input_mode_frame, text="Stawka godzinowa", variable=tryb_rozliczenia_var, value="godzinowa", command=zmien_tryb_wprowadzania_uop).pack(side=LEFT, padx=(0,10))
ttk.Radiobutton(input_mode_frame, text="Kwota brutto", variable=tryb_rozliczenia_var, value="miesieczna", command=zmien_tryb_wprowadzania_uop).pack(side=LEFT)
obliczona_stawka_frame = ttk.Frame(uop_input_frame); obliczona_stawka_frame.grid(row=2, column=0, columnspan=3, sticky=W, padx=15, pady=(5,0)); obliczona_stawka_frame.grid_remove()
ttk.Label(obliczona_stawka_frame, text="Obliczona stawka godzinowa:", font="-weight bold").pack(side=LEFT)
label_obliczona_stawka_wartosc = ttk.Label(obliczona_stawka_frame, text="0.00 zł/h", bootstyle="info", font="-weight bold"); label_obliczona_stawka_wartosc.pack(side=LEFT, padx=10)
main_input_frame = ttk.Frame(uop_input_frame); main_input_frame.grid(row=3, column=0, columnspan=3, sticky=EW, padx=15); main_input_frame.columnconfigure(1, weight=1)
label_stawka_lub_kwota = ttk.Label(main_input_frame, text="Stawka godzinowa brutto (zł):", font="-weight bold"); label_stawka_lub_kwota.grid(row=0, column=0, sticky=W)
entry_stawka_lub_kwota = ttk.Entry(main_input_frame); entry_stawka_lub_kwota.grid(row=0, column=1, sticky=EW, padx=(10, 0)); entry_stawka_lub_kwota.insert(0, "0")
shift_duration_frame = ttk.Frame(uop_input_frame); shift_duration_frame.grid(row=4, column=1, columnspan=2, sticky=E, padx=15, pady=5)
dlugosc_zmiany_var = ttk.StringVar(value="8")
ttk.Radiobutton(shift_duration_frame, text="8h", variable=dlugosc_zmiany_var, value="8").pack(side=LEFT); ttk.Radiobutton(shift_duration_frame, text="10h", variable=dlugosc_zmiany_var, value="10").pack(side=LEFT); ttk.Radiobutton(shift_duration_frame, text="12h", variable=dlugosc_zmiany_var, value="12").pack(side=LEFT)
ttk.Label(uop_input_frame, text="Długość zmiany:", font="-weight bold").grid(row=4, column=0, sticky=W, padx=15)

# POPRAWKA ETYKIETY
pola = ["Ilość zmian dziennych:", "Ilość zmian nocnych:", "Dni na L4 (80%):", "Premia brutto (zł):", "Nadgodziny dzienne (+50%):", "Nadgodziny nocne (+50%):", "Nadgodziny nocne w niedzielę (+100%):", "Niewykorzystane dni urlopu:"]

entries = {}
for i, opis in enumerate(pola):
    ttk.Label(uop_input_frame, text=opis, font="-weight bold").grid(row=i + 5, column=0, sticky=W, pady=2, padx=15)
    entry = ttk.Entry(uop_input_frame); entry.grid(row=i + 5, column=1, sticky=EW, pady=2, padx=15); entry.insert(0, "0"); entries[opis] = entry
ulgi_frame = ttk.Labelframe(uop_tab, text="Ulgi i Odliczenia", bootstyle="primary"); ulgi_frame.pack(fill=X, expand=True, pady=10); ulgi_frame.columnconfigure(1, weight=1)
ulgi_pola = {"Darowizny (kwota mies.)": None, "Ulga na internet (kwota mies.)": "max 63.33 zł/mies", "Ulga na dziecko (kwota mies.)": "np. 92.67 zł"}
ulgi_entries = {}
for i, (opis, hint) in enumerate(ulgi_pola.items()):
    ttk.Label(ulgi_frame, text=opis, font="-weight bold").grid(row=i, column=0, sticky=W, padx=15, pady=2)
    entry = ttk.Entry(ulgi_frame, width=15); entry.grid(row=i, column=1, sticky=E, padx=15, pady=2); entry.insert(0, "0.0"); ulgi_entries[opis] = entry
    if hint: ttk.Label(ulgi_frame, text=hint, font=('Helvetica', 8, 'italic')).grid(row=i, column=2, sticky=W, padx=5)
opcja_ulga_seniora = ttk.BooleanVar(); ttk.Checkbutton(ulgi_frame, text="Ulga dla pracujących seniorów", variable=opcja_ulga_seniora, bootstyle="info-round-toggle").grid(row=len(ulgi_pola), columnspan=3, sticky=W, padx=15, pady=5)
opcja_ulga_4plus = ttk.BooleanVar(); ttk.Checkbutton(ulgi_frame, text="Ulga dla rodzin 4+", variable=opcja_ulga_4plus, bootstyle="info-round-toggle").grid(row=len(ulgi_pola)+1, columnspan=3, sticky=W, padx=15, pady=(5, 10))
opcja_pit_zero_uop = ttk.BooleanVar(); ttk.Checkbutton(ulgi_frame, text="Mam mniej niż 26 lat (Ulga PIT-0)", variable=opcja_pit_zero_uop, bootstyle="info-round-toggle").grid(row=len(ulgi_pola)+2, columnspan=3, sticky=W, padx=15, pady=5)
opcja_ppk_uop = ttk.BooleanVar(); ttk.Checkbutton(ulgi_frame, text="Uczestniczę w PPK (2% składki)", variable=opcja_ppk_uop, bootstyle="info-round-toggle").grid(row=len(ulgi_pola)+3, columnspan=3, sticky=W, padx=15, pady=5)

# --- Sekcja UMOWY ZLECENIE (bez zmian) ---
zlecenie_input_frame = ttk.Labelframe(zlecenie_tab, text="Dane Wejściowe", bootstyle="info"); zlecenie_input_frame.pack(fill=X, expand=True, pady=(0, 10))
zlecenie_tryb_var = ttk.StringVar(value="godzinowa")
zlecenie_mode_frame = ttk.Frame(zlecenie_input_frame); zlecenie_mode_frame.pack(fill=X, padx=15, pady=10)
ttk.Radiobutton(zlecenie_mode_frame, text="Stawka godzinowa", variable=zlecenie_tryb_var, value="godzinowa", command=zmien_tryb_wprowadzania_zlecenie).pack(side=LEFT, padx=(0,10))
ttk.Radiobutton(zlecenie_mode_frame, text="Kwota brutto", variable=zlecenie_tryb_var, value="miesieczna", command=zmien_tryb_wprowadzania_zlecenie).pack(side=LEFT)
label_zlecenie_stawka_lub_kwota = ttk.Label(zlecenie_input_frame, text="Stawka godzinowa brutto (zł):", font="-weight bold"); label_zlecenie_stawka_lub_kwota.pack(fill=X, padx=15, pady=(5,0))
entry_zlecenie_stawka_lub_kwota = ttk.Entry(zlecenie_input_frame); entry_zlecenie_stawka_lub_kwota.pack(fill=X, padx=15, pady=(0, 10)); entry_zlecenie_stawka_lub_kwota.insert(0, "0")
zlecenie_praca_frame = ttk.Frame(zlecenie_input_frame); zlecenie_praca_frame.pack(fill=X, padx=15, pady=10); zlecenie_praca_frame.columnconfigure(1, weight=1)
ttk.Label(zlecenie_praca_frame, text="Ilość zmian w miesiącu:", font="-weight bold").grid(row=0, column=0, sticky=W)
entry_zlecenie_zmian = ttk.Entry(zlecenie_praca_frame, width=8); entry_zlecenie_zmian.grid(row=0, column=1, sticky=W, padx=10); entry_zlecenie_zmian.insert(0, "0")
zlecenie_shift_duration_frame = ttk.Frame(zlecenie_praca_frame); zlecenie_shift_duration_frame.grid(row=0, column=2, sticky=E)
zlecenie_dlugosc_zmiany_var = ttk.StringVar(value="8")
ttk.Label(zlecenie_shift_duration_frame, text="Długość zmiany:").pack(side=LEFT, padx=(10,5))
ttk.Radiobutton(zlecenie_shift_duration_frame, text="8h", variable=zlecenie_dlugosc_zmiany_var, value="8").pack(side=LEFT); ttk.Radiobutton(zlecenie_shift_duration_frame, text="10h", variable=zlecenie_dlugosc_zmiany_var, value="10").pack(side=LEFT); ttk.Radiobutton(zlecenie_shift_duration_frame, text="12h", variable=zlecenie_dlugosc_zmiany_var, value="12").pack(side=LEFT)
obliczona_stawka_frame_zlecenie = ttk.Frame(zlecenie_input_frame)
ttk.Label(obliczona_stawka_frame_zlecenie, text="Obliczona stawka godzinowa:", font="-weight bold").pack(side=LEFT)
label_obliczona_stawka_wartosc_zlecenie = ttk.Label(obliczona_stawka_frame_zlecenie, text="0.00 zł/h", bootstyle="info", font="-weight bold"); label_obliczona_stawka_wartosc_zlecenie.pack(side=LEFT, padx=10)
zlecenie_options_frame = ttk.Labelframe(zlecenie_tab, text="Opcje", bootstyle="info"); zlecenie_options_frame.pack(fill=X, expand=True)
opcja_student = ttk.BooleanVar(); ttk.Checkbutton(zlecenie_options_frame, text="Jestem studentem/uczniem do 26 r.ż.", variable=opcja_student, bootstyle="info-round-toggle").pack(anchor=W, padx=15, pady=5)
opcja_pit_zero_zlecenie = ttk.BooleanVar(); ttk.Checkbutton(zlecenie_options_frame, text="Mam mniej niż 26 lat (Ulga PIT-0, nie jestem studentem)", variable=opcja_pit_zero_zlecenie, bootstyle="info-round-toggle").pack(anchor=W, padx=15, pady=5)
opcja_chorobowe_zlecenie = ttk.BooleanVar(); ttk.Checkbutton(zlecenie_options_frame, text="Dobrowolna składka chorobowa (2.45%)", variable=opcja_chorobowe_zlecenie, bootstyle="info-round-toggle").pack(anchor=W, padx=15, pady=5)
opcja_kwota_zmn_zlecenie = ttk.BooleanVar(value=True); ttk.Checkbutton(zlecenie_options_frame, text="Zastosuj kwotę zmniejszającą podatek (PIT-2)", variable=opcja_kwota_zmn_zlecenie, bootstyle="info-round-toggle").pack(anchor=W, padx=15, pady=5)

# --- WSPÓLNE ELEMENTY NA DOLE ---
button_frame = ttk.Frame(scrollable_frame); button_frame.pack(pady=20)
przycisk_oblicz = ttk.Button(button_frame, text="Oblicz Wynagrodzenie", command=oblicz_wyplate, bootstyle="success"); przycisk_oblicz.pack(ipady=8, ipadx=20)
results_frame = ttk.Frame(scrollable_frame); results_frame.pack(fill=BOTH, expand=True)
results_frame.columnconfigure(0, weight=1, uniform='group1'); results_frame.columnconfigure(1, weight=1, uniform='group1')
wyniki_labels = {}
potracenia_frame = ttk.Labelframe(results_frame, text="Potrącenia", bootstyle="light"); potracenia_frame.grid(row=0, column=0, sticky=NSEW, padx=(0, 10)); potracenia_frame.columnconfigure(1, weight=1)
potracenia_pola = {"emerytalna": "Składka emerytalna", "rentowa": "Składka rentowa", "chorobowa": "Składka chorobowa", "ppk": "Składka PPK", "zdrowotna": "Składka zdrowotna"}
for i, (key, opis) in enumerate(potracenia_pola.items()):
    ttk.Label(potracenia_frame, text=opis, font="-weight bold").grid(row=i, column=0, sticky=W, padx=15, pady=2)
    wyniki_labels[key] = ttk.Label(potracenia_frame, text="0.00 zł", anchor=E, font="-weight bold"); wyniki_labels[key].grid(row=i, column=1, sticky=EW, padx=15, pady=2)
ttk.Separator(potracenia_frame, bootstyle="secondary").grid(row=len(potracenia_pola), column=0, columnspan=2, sticky=EW, pady=5)
ttk.Label(potracenia_frame, text="Suma potrąceń", font="-size 11 -weight bold").grid(row=len(potracenia_pola)+1, column=0, sticky=W, padx=15, pady=5)
wyniki_labels["suma_potracen"] = ttk.Label(potracenia_frame, text="0.00 zł", font="-size 11 -weight bold", anchor=E); wyniki_labels["suma_potracen"].grid(row=len(potracenia_pola)+1, column=1, sticky=EW, padx=15, pady=5)
sumy_frame = ttk.Labelframe(results_frame, text="Podsumowanie", bootstyle="light"); sumy_frame.grid(row=0, column=1, sticky=NSEW, padx=(10, 0)); sumy_frame.columnconfigure(1, weight=1)
sumy_pola = {"przychód_miesiąc": "Przychód (brutto)", "podstawa_zus": "Podstawa ZUS", "podstawa_zdrowotna": "Podstawa składki zdrow.", "podstawa_opodatkowania": "Podstawa opodatkowania", "zaliczka_pit": "Zaliczka na podatek (PIT)"}
for i, (key, opis) in enumerate(sumy_pola.items()):
    ttk.Label(sumy_frame, text=opis, font="-weight bold").grid(row=i, column=0, sticky=W, padx=15, pady=2)
    wyniki_labels[key] = ttk.Label(sumy_frame, text="0.00 zł", anchor=E, font="-weight bold"); wyniki_labels[key].grid(row=i, column=1, sticky=EW, padx=15, pady=2)
ttk.Separator(sumy_frame, bootstyle="secondary").grid(row=len(sumy_pola), column=0, columnspan=2, sticky=EW, pady=5)
ttk.Label(sumy_frame, text="NA RĘKĘ", bootstyle="success", font="-size 14 -weight bold").grid(row=len(sumy_pola)+1, column=0, sticky=W, padx=15, pady=10)
wyniki_labels["netto"] = ttk.Label(sumy_frame, text="0.00 zł", bootstyle="success", font="-size 14 -weight bold", anchor=E); wyniki_labels["netto"].grid(row=len(sumy_pola)+1, column=1, sticky=EW, padx=15, pady=10)

window.mainloop()
