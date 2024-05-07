/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import mockStore from "../__mocks__/store.js";

import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

jest.mock("../app/store", () => mockStore);

describe("When I am on Bills page but it is loading", () => {
  test("Then, loading page should be rendered", () => {
    document.body.innerHTML = BillsUI({ loading: true });
    expect(screen.getAllByText("Loading...")).toBeTruthy();
  });
});
describe("Given I am connected as an employee", () => {
    
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
    test("Then a modal should open when I clicked on eye icon", async () => {
      await waitFor(() => screen.getAllByTestId("icon-eye"));
      const iconsEyes = screen.getAllByTestId("icon-eye");
      const iconEye = iconsEyes[0];
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const bill = new Bills({
        document,
        onNavigate,
        store: null,
        bills: bills,
        localStorage: window.localStorage,
      });
      const modale = document.getElementById("modaleFile");
      $.fn.modal = jest.fn(() => modale.classList.add("show"));
      const handleClickIconEye = jest.fn(bill.handleClickIconEye(iconEye));
      iconEye.addEventListener("click", handleClickIconEye);
      userEvent.click(iconEye);
      expect(handleClickIconEye).toHaveBeenCalled();
      expect(modale).toBeTruthy();
    });
  });
  test("no eye icon is present", async () => {
    // Créez une maquette de l'interface utilisateur sans icône "eye"
    document.body.innerHTML = BillsUI({ data: [] });
  
    // Vérifiez qu'aucun élément avec l'attribut data-testid="icon-eye" n'est présent
    const eyeIcons = screen.queryAllByTestId("icon-eye");
    expect(eyeIcons.length).toBe(0);
  });
});

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {

  beforeAll(() => {
    document.body.innerHTML = BillsUI({ data: bills });
  });


  describe("When I am to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => {
        expect(screen.getByText("Mes notes de frais")).toBeTruthy();
        expect(screen.getByText("Hôtel et logement")).toBeTruthy();
      });
    });

    test("when date is corrupted", async () => {
      mockStore.bills().list = () => {
        return Promise.resolve([
          {
            id: "47qAXb6fIm2zOKkLzMro",
            vat: "80",
            fileUrl:
              "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
            status: "pending",
            type: "ERROR",
            commentary: "séminaire billed",
            name: "encore",
            fileName: "preview-facture-free-201801-pdf-1.jpg",
            amount: 400,
            commentAdmin: "ok",
            email: "a@a",
            pct: 20,
            date: "20000004-04-04",
          },
        ]);
      };
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => {
        expect(screen.getByText("ERROR")).toBeTruthy();
        expect(screen.getByText("20000004-04-04")).toBeTruthy();
      });
    });
  });
});

describe("Given I am a user connected as Employee", () => {
  describe("When I click on new bill button", () => {
    test("Then new bill page should be rendered", () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      const bill = new Bills({
        document,
        onNavigate,
        store: null,
        bills: bills,
        localStorage: window.localStorage,
      });
      const handleClickNewBill = jest.fn(bill.handleClickNewBill);
      const buttonNewBill = screen.getByTestId("btn-new-bill");
      buttonNewBill.addEventListener("click", handleClickNewBill);
      userEvent.click(buttonNewBill);
      expect(handleClickNewBill).toHaveBeenCalled();
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
    });
  });
});