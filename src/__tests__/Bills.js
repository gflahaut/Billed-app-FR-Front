/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import mockStore from "../__mocks__/store.js";

import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee and I am on the Bills page", () => {
  describe("While it is loading", () => {
    test("Then the loading text should be displayed", () => {
      document.body.innerHTML = BillsUI({ loading: true });
      expect(screen.getAllByText("Loading...")).toBeTruthy();
    });
  });

  test("Then bills should be ordered by descending date", () => {
    document.body.innerHTML = BillsUI({ data: bills });
  
    const dates = screen
      .getAllByText(/\d{4}[- /.]\d{2}[- /.]\d{2}/i)
      .map(dateElement => dateElement.innerHTML);
  
    const descendingOrder = (a, b) => (a < b ? 1 : -1);
    const sortedDates = [...dates].sort(descendingOrder);
  
    expect(dates).toEqual(sortedDates);
  });

  describe("When I click on the preview icon", () => {
    test("Then a modal should open", async () => {
      await waitFor(() => screen.getAllByTestId("icon-eye"));
      
      const iconEyes = screen.getAllByTestId("icon-eye");
      const firstIconEye = iconEyes[0];
      
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
  
      const modalElement = document.getElementById("modaleFile");
      $.fn.modal = jest.fn(() => modalElement.classList.add("show"));
  
      const handleClickIconEye = jest.fn(() => bill.handleClickIconEye(firstIconEye));
      firstIconEye.addEventListener("click", handleClickIconEye);
  
      userEvent.click(firstIconEye);
  
      expect(handleClickIconEye).toHaveBeenCalled();
      expect(modalElement.classList.contains("show")).toBe(true);
    });
  });

  test("the GET request to fetch all the bills should work", async () => {
    document.body.innerHTML = BillsUI({ data: bills });
  
    localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
    
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    
    router();
    window.onNavigate(ROUTES_PATH.Bills);
  
    await waitFor(() => {
      expect(screen.getAllByText("Transports")).toBeTruthy();
      expect(screen.getAllByText("Services en ligne")).toBeTruthy();
    });
  });

  test("the GET request to fetch all the bills should handle an error", async () => {
    // Simulate an error response for the fetch request
    global.fetch = jest.fn(() =>
      Promise.reject(new Error("Fetch error"))
    );
  
    document.body.innerHTML = BillsUI({ data: [] });
    localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
  
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    
    router();
    window.onNavigate(ROUTES_PATH.Bills);
  
    await waitFor(() => {
      expect(screen.getByTestId("tbody").querySelectorAll("tr").length).toBe(0);
    });
  
    // Restore the original fetch implementation
    global.fetch.mockRestore();
  });
});