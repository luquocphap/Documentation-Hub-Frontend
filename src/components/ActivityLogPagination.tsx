import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ActivityLogPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

type PaginationEntry = number | "ellipsis-start" | "ellipsis-end";

const getPaginationEntries = (
  currentPage: number,
  totalPages: number
): PaginationEntry[] => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis-end", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      "ellipsis-start",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis-start",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis-end",
    totalPages,
  ];
};

export function ActivityLogPagination({
  page,
  totalPages,
  onPageChange,
}: ActivityLogPaginationProps) {
  const normalizedTotalPages = Math.max(totalPages, 1);
  const entries = getPaginationEntries(page, normalizedTotalPages);
  const isPreviousDisabled = page <= 1;
  const isNextDisabled = page >= normalizedTotalPages;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            text=""
            size="default"
            aria-disabled={isPreviousDisabled}
            tabIndex={isPreviousDisabled ? -1 : 0}
            className={isPreviousDisabled ? "pointer-events-none opacity-50" : ""}
            onClick={(event) => {
              event.preventDefault();
              if (!isPreviousDisabled) {
                onPageChange(page - 1);
              }
            }}
          />
        </PaginationItem>

        {entries.map((entry) => (
          <PaginationItem key={entry}>
            {typeof entry === "number" ? (
              <PaginationLink
                href="#"
                size="icon"
                isActive={entry === page}
                onClick={(event) => {
                  event.preventDefault();
                  onPageChange(entry);
                }}
              >
                {entry}
              </PaginationLink>
            ) : (
              <PaginationEllipsis />
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href="#"
            text=""
            size="default"
            aria-disabled={isNextDisabled}
            tabIndex={isNextDisabled ? -1 : 0}
            className={isNextDisabled ? "pointer-events-none opacity-50" : ""}
            onClick={(event) => {
              event.preventDefault();
              if (!isNextDisabled) {
                onPageChange(page + 1);
              }
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
