type ViewInputProps = {
  className?: string;
  label: string;
  value?: string;
};

const ViewInput: React.FC<ViewInputProps> = ({ className, label, value }) => {
  return (
    <>
      <div className={className}>
        <h4 className="text-body-sm font-medium text-dark dark:text-white">
          {label}
        </h4>

        <div className="relative mt-2 [&_svg]:absolute [&_svg]:top-1/2 [&_svg]:-translate-y-1/2">
          <p className="capitalize w-full rounded-lg border-[1.5px] border-stroke bg-transparent outline-none transition focus:border-primary disabled:cursor-default disabled:bg-gray-2 data-[active=true]:border-primary dark:border-dark-3 dark:bg-dark-2 dark:focus:border-primary dark:disabled:bg-dark dark:data-[active=true]:border-primary px-5.5 py-3 text-dark placeholder:text-dark-6 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </>
  );
};

export default ViewInput;
