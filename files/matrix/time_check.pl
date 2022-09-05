
$fun = @ARGV[0];

my $begin_time = time();
print ($begin_time . "\n");


$cmd = "powershell -Command \"Measure-Command {serverless invoke -f $fun }\"";
#$cmd = "powershell -Command \"Measure-Command {wsk action invoke $fun-dev-$fun --result}\"";

open(RESFILE, ">resfile.txt");

for($i = 0; $i < 10; $i++){
    $cont = qx($cmd\n);
    if($cont =~ /Seconds           : (\d+)\nMilliseconds      : (\d+?)\n/){
        print RESFILE ("$1 $2\n");
    }
}

close(RESFILE);