# Übergabe-Generator

Generator raportu przekazania zmiany dla dyspozytora transportu. Wklejasz listę zleceń i chaotyczne notatki (PL/DE), a dostajesz uporządkowany raport po niemiecku: statusy pojazdów, opóźnienia i otwarte sprawy z osobą oraz terminem.

## Dla kogo

Dla dyspozytora, który przekazuje zmianę. To narzędzie dla jednej osoby: bez logowania, bez serwera i bez instalacji. Interfejs jest po polsku.

## Jak użyć

1. Ustaw datę, zmianę i imię dyspozytora.
2. W polu „Zlecenia” wklej listę skopiowaną z Excela (pierwszy wiersz to nagłówki, np. LKW, Kennzeichen, Auftrag, Kunde, Route, Plan, ETA, Status).
3. W polu „Notatki” wklej notatki, najlepiej po jednej sprawie w linii.
4. Kliknij **Generuj**. Żeby zobaczyć, jak to działa, użyj najpierw **Wczytaj przykład**.
5. Sprawdź tabelę „Offene Punkte”. Osobę i termin możesz poprawić, a punkty usuwać i dodawać.
6. **Kopiuj raport** kopiuje wersję tekstową, a **Drukuj / PDF** otwiera okno druku (A4).
7. **Przenieś otwarte sprawy na następną zmianę** zaczyna nowy raport z pozostałymi punktami.

Raport powstaje według prostych reguł (słowa-klucze), bez sztucznej inteligencji. Może coś pominąć albo źle przypisać, więc przeczytaj go przed przekazaniem. Brakująca osoba lub termin są oznaczone jako „ergänzen”.

## Gdzie są dane

- To, co wpiszesz, zostaje **w Twojej przeglądarce** (`localStorage`). Aplikacja nigdzie tego nie wysyła.
- Dane **nie przechodzą między urządzeniami** ani przeglądarkami. Wyczyszczenie danych przeglądarki je usuwa.
- Zapisywana jest wersja robocza, imię dyspozytora i historia ostatnich 10 przekazań.
- Dane nie są szyfrowane. Na wspólnym komputerze po pracy kliknij **Wyczyść dane**.

## Dane przykładowe

Dane przykładowe (przycisk „Wczytaj przykład” i folder `dane-przykladowe/`) są **fikcyjne**: firmy, zlecenia, numery rejestracyjne, notatki, osoby i zdarzenia zostały wymyślone. Nazwy miejscowości są prawdziwe. Ewentualna zbieżność z istniejącymi firmami, osobami lub pojazdami jest przypadkowa.

## Uruchomienie lokalne

Cała aplikacja to jeden plik: otwórz `index.html` w przeglądarce.
