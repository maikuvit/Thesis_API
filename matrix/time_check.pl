
$fun = @ARGV[0];

my $begin_time = time();
print ($begin_time . "\n");


$cmd = "powershell -Command \"Measure-Command {serverless invoke -f $fun }\"";
#$cmd = "wsk action ";
print $cmd;

$cont = qx($cmd\n);

my $end_time = time();
print ($end_time . "\n");

print ($cont);

print ($end_time - $begin_time);
