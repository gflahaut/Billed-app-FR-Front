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

jest.mock("../app/format", () => ({
  formatDate: jest.fn(),
  formatStatus: jest.fn(),
})); 

import Bills from "../containers/Bills.js";
import { formatDate, formatStatus } from "../app/format.js";

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
  
  describe("Given I am connected as an employee and I am on the Bills page", () => {
    test("handleClickNewBill navigates to NewBill route", () => {
      const mockOnNavigate = jest.fn();
      const component = new Bills({
        document,
        onNavigate: mockOnNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      component.handleClickNewBill();
      expect(mockOnNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });
  });

  describe("Given I am connected as an employee", () => {
    describe("When an error occurs in formatDate in getBills", () => {
      test("Then the error should be logged and the original document should be returned with formatted status", async () => {
        const mockConsoleLog = jest.spyOn(console, "log").mockImplementation();
        const documentData = {
          id: "1",
          date: "2021-05-21",
          status: "pending"
        };
        formatDate.mockImplementation(() => {
          throw new Error("Invalid date format");
        });
        formatStatus.mockReturnValue("En attente");
        mockStore.bills = jest.fn(() => ({
          list: jest.fn().mockResolvedValue([documentData])
        }));
  
        const bills = new Bills({
          document: document,
          onNavigate: jest.fn(),
          store: mockStore,
          localStorage: window.localStorage,
        });
        const result = await bills.getBills();
        expect(mockConsoleLog).toHaveBeenCalledWith(expect.any(Error), 'for', documentData);
        expect(result).toEqual([{
          ...documentData,
          date: documentData.date,
          status: "En attente"
        }]);
        mockConsoleLog.mockRestore();
      });
    });
  });
});