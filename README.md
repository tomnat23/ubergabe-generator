# Übergabe-Generator

Generator raportu przekazania zmiany dla dyspozytora transportu. Wklejasz listę zleceń i chaotyczne notatki (PL/DE), a dostajesz uporządkowany raport po niemiecku: statusy pojazdów, opóźnienia i otwarte sprawy z osobą oraz terminem.

## Dla kogo

Dla dyspozytora, który przekazuje zmianę. To narzędzie dla jednej osoby: bez logowania, bez własnego serwera i bez instalacji. Interfejs jest po polsku. Wysyłka na Telegram jest opcjonalna i wymaga Twojego n8n.

## Jak użyć

1. Ustaw datę, zmianę i imię dyspozytora.
2. W polu „Zlecenia” wklej listę skopiowaną z Excela (pierwszy wiersz to nagłówki, np. LKW, Kennzeichen, Auftrag, Kunde, Route, Plan, ETA, Status).
3. W polu „Notatki” wklej notatki, najlepiej po jednej sprawie w linii.
4. Kliknij **Generuj**. Żeby zobaczyć, jak to działa, użyj najpierw **Wczytaj przykład**.
5. Sprawdź tabelę „Offene Punkte”. Osobę i termin możesz poprawić, a punkty usuwać i dodawać.
6. **Kopiuj raport** kopiuje wersję tekstową, a **Drukuj / PDF** otwiera okno druku (A4).
7. **Przenieś otwarte sprawy na następną zmianę** zaczyna nowy raport z pozostałymi punktami.

Raport powstaje według prostych reguł (słowa-klucze), bez sztucznej inteligencji. Może coś pominąć albo źle przypisać, więc przeczytaj go przed przekazaniem. Brakująca osoba lub termin są oznaczone jako „ergänzen”.

## Wysyłka na Telegram (opcjonalnie)

1. Rozwiń **Ustawienia** i wklej pełny adres webhooka n8n (`https://…`).
2. Po „Generuj” kliknij **Wyślij na Telegram** i potwierdź pytanie na stronie.
3. Obok przycisku pojawi się „Wysłano ✓” albo treść błędu. „Brak połączenia z n8n” oznacza, że przeglądarka nie dostała odpowiedzi (sieć, zły adres lub blokada CORS). Po takim błędzie, a także po braku odpowiedzi przez 20 sekund, sprawdź grupę przed ponowną wysyłką.

Przycisk jest nieaktywny, dopóki nie ma raportu i poprawnego adresu. Adres webhooka zapisuje się tylko w Twojej przeglądarce i nie ma go w kodzie ani w repozytorium. Traktuj go jak hasło: kto go zna, może wysyłać wiadomości przez Twój workflow.

### Czego oczekuje aplikacja od n8n

- Węzeł **Webhook** z metodą `POST`. Aplikacja wysyła `Content-Type: application/json` i treść `{"text": "…"}`, czyli tę samą wersję tekstową co **Kopiuj raport**, z ręcznymi poprawkami.
- **CORS:** w opcji „Allowed Origins (CORS)” węzła Webhook musi być dozwolona domena strony, np. `https://tomnat23.github.io` (albo `*`).
- **Odpowiedź** `{"ok":true}` dopiero po wysłaniu na Telegram, np. przez węzeł **Respond to Webhook** na końcu workflow. Natychmiastowa odpowiedź „Workflow was started” pokaże się w aplikacji jako błąd.
- **Długie raporty:** Telegram przyjmuje najwyżej **4096 znaków** w jednej wiadomości, a raport z danych przykładowych ma ich ponad 4200. Aplikacja nie skraca ani nie dzieli tekstu, więc workflow musi go podzielić na części albo wysłać jako plik.
- **Formatowanie:** węzeł Telegram może domyślnie czytać tekst jako Markdown, a wtedy znaki takie jak `_` lub `*` w notatkach mogą wywołać błąd. Sprawdź ustawienie „Parse Mode”. Tabele wyrównane spacjami mogą się w Telegramie rozjechać.

## Gdzie są dane

- Dane zostają **w Twojej przeglądarce** (`localStorage`), **chyba że sam klikniesz „Wyślij na Telegram”** i potwierdzisz. Wtedy tekst raportu (z notatkami i nazwiskami) trafia na podany przez Ciebie adres n8n, a stamtąd na grupę Telegram. Aplikacja nie może go stamtąd usunąć.
- Dane **nie przechodzą między urządzeniami** ani przeglądarkami. Wyczyszczenie danych przeglądarki je usuwa.
- Zapisywana jest wersja robocza, imię dyspozytora, adres webhooka i historia ostatnich 10 przekazań.
- Dane nie są szyfrowane. Na wspólnym komputerze po pracy kliknij **Wyczyść dane** (usuwa też adres webhooka).

## Dane przykładowe

Dane przykładowe (przycisk „Wczytaj przykład” i folder `dane-przykladowe/`) są **fikcyjne**: firmy, zlecenia, numery rejestracyjne, notatki, osoby i zdarzenia zostały wymyślone. Nazwy miejscowości są prawdziwe. Ewentualna zbieżność z istniejącymi firmami, osobami lub pojazdami jest przypadkowa.

## Uruchomienie lokalne

Cała aplikacja to jeden plik: otwórz `index.html` w przeglądarce.
